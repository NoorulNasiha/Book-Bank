const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey12345';

// --- Authentication Routes ---
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role, studentRef } = req.body;
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already in use' });
    
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role, studentRef }
    });
    
    res.json({ message: 'User registered successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Middleware ---
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Failed to authenticate token' });
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
};

const staffOnly = (req, res, next) => {
  if (req.userRole !== 'STAFF') return res.status(403).json({ error: 'Staff only' });
  next();
};

// --- Book Routes ---
app.get('/api/books', async (req, res) => {
  const { search, semester } = req.query;
  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { author: { contains: search } }
    ];
  }
  if (semester) {
    where.semester = semester;
  }
  const books = await prisma.book.findMany({ where });
  res.json(books);
});

app.post('/api/books', authMiddleware, staffOnly, async (req, res) => {
  const { name, author, semester, availabilityStatus } = req.body;
  const book = await prisma.book.create({
    data: { name, author, semester, availabilityStatus: availabilityStatus || 'AVAILABLE' }
  });
  res.json(book);
});

app.delete('/api/books/:id', authMiddleware, staffOnly, async (req, res) => {
  await prisma.book.delete({ where: { id: req.params.id } });
  res.json({ message: 'Deleted' });
});

// --- Request Routes ---
app.post('/api/requests', authMiddleware, async (req, res) => {
  const { bookId } = req.body;
  if (req.userRole !== 'STUDENT') return res.status(403).json({ error: 'Students only' });
  
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (book.availabilityStatus !== 'AVAILABLE') return res.status(400).json({ error: 'Book not available' });

  const request = await prisma.request.create({
    data: {
      studentId: req.userId,
      bookId,
      status: 'PENDING'
    }
  });
  res.json(request);
});

app.get('/api/requests', authMiddleware, async (req, res) => {
  if (req.userRole === 'STUDENT') {
    const requests = await prisma.request.findMany({
      where: { studentId: req.userId },
      include: { book: true }
    });
    return res.json(requests);
  } else {
    // Staff View
    const requests = await prisma.request.findMany({
      include: { book: true, student: { select: { name: true, email: true, studentRef: true } } }
    });
    return res.json(requests);
  }
});

app.put('/api/requests/:id/status', authMiddleware, staffOnly, async (req, res) => {
  const { status } = req.body; // "APPROVED", "REJECTED", "RETURNED"
  const requestId = req.params.id;
  
  const request = await prisma.request.findUnique({ where: { id: requestId } });
  if (!request) return res.status(404).json({ error: 'Not found' });
  
  const updateData = { status };
  if (status === 'APPROVED') {
    updateData.issueDate = new Date();
    // Due 14 days later
    const returnDate = new Date();
    returnDate.setDate(returnDate.getDate() + 14);
    updateData.returnDate = returnDate;
    
    await prisma.book.update({
      where: { id: request.bookId },
      data: { availabilityStatus: 'BORROWED' }
    });
  } else if (status === 'RETURNED' || status === 'REJECTED') {
    await prisma.book.update({
      where: { id: request.bookId },
      data: { availabilityStatus: 'AVAILABLE' }
    });
  }
  
  const updatedReq = await prisma.request.update({
    where: { id: requestId },
    data: updateData
  });
  
  res.json(updatedReq);
});

// --- Fine Routes ---
app.get('/api/fines', authMiddleware, async (req, res) => {
  if (req.userRole === 'STUDENT') {
    const fines = await prisma.fine.findMany({ where: { studentId: req.userId }, include: { book: true } });
    return res.json(fines);
  } else {
    const fines = await prisma.fine.findMany({ include: { book: true, student: true } });
    return res.json(fines);
  }
});

app.post('/api/fines/calculate', authMiddleware, staffOnly, async (req, res) => {
  // CRON job-like API for calculating missing fines for overdue books
  const overdueRequests = await prisma.request.findMany({
    where: {
      status: 'APPROVED',
      returnDate: { lt: new Date() }
    }
  });
  
  let newFines = 0;
  for (const req of overdueRequests) {
    const daysOverdue = Math.floor((new Date() - req.returnDate) / (1000 * 60 * 60 * 24));
    if (daysOverdue > 0) {
      const fineAmount = daysOverdue * 10; // e.g., 10 per day
      // check if fine already exists for this book/student unpaid
      const existingFine = await prisma.fine.findFirst({
        where: { studentId: req.studentId, bookId: req.bookId, status: 'UNPAID' }
      });
      if (existingFine) {
        await prisma.fine.update({
          where: { id: existingFine.id },
          data: { amount: fineAmount }
        });
      } else {
        await prisma.fine.create({
          data: {
            studentId: req.studentId,
            bookId: req.bookId,
            amount: fineAmount,
            status: 'UNPAID'
          }
        });
        newFines++;
      }
    }
  }
  res.json({ message: 'Fines calculated successfully', newFines });
});

app.put('/api/fines/:id/pay', authMiddleware, staffOnly, async (req, res) => {
  const fine = await prisma.fine.update({
    where: { id: req.params.id },
    data: { status: 'PAID' }
  });
  res.json(fine);
});

// Basic AI Mock Endpoint
app.post('/api/ai/recommend', authMiddleware, async (req, res) => {
  const { interest } = req.body;
  // This simulates an AI matching logic.
  // We'll just do a semantic-like mock.
  const books = await prisma.book.findMany();
  const keywords = interest.toLowerCase().split(' ');
  const recommendations = books.filter(b => 
    keywords.some(k => b.name.toLowerCase().includes(k) || b.author.toLowerCase().includes(k) || b.semester.toLowerCase() === k)
  );
  res.json(recommendations);
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
