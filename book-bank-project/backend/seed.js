const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Clear existing
  await prisma.fine.deleteMany();
  await prisma.request.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const staffHash = await bcrypt.hash('staffpass', 10);
  const staff = await prisma.user.create({
    data: { name: 'Admin Staff', email: 'admin@bookbank.com', passwordHash: staffHash, role: 'STAFF' }
  });

  const studentHash = await bcrypt.hash('studentpass', 10);
  const student = await prisma.user.create({
    data: { name: 'John Doe', email: 'student@school.edu', passwordHash: studentHash, role: 'STUDENT', studentRef: 'S101' }
  });

  // Create Books (30 books across Semesters 1 to 6)
  const booksData = [
    // Sem 1
    { name: 'Engineering Physics', author: 'Resnick Halliday', semester: '1' },
    { name: 'Calculus I', author: 'James Stewart', semester: '1' },
    { name: 'Introduction to Programming (C)', author: 'Dennis Ritchie', semester: '1' },
    { name: 'Basic Electrical Engineering', author: 'V.N. Mittle', semester: '1' },
    { name: 'Engineering Graphics', author: 'N.D. Bhatt', semester: '1' },
    // Sem 2
    { name: 'Engineering Chemistry', author: 'P.C. Jain', semester: '2' },
    { name: 'Calculus II', author: 'George B. Thomas', semester: '2' },
    { name: 'Programming in C++', author: 'Bjarne Stroustrup', semester: '2' },
    { name: 'Basic Electronics', author: 'B.L. Theraja', semester: '2' },
    { name: 'Environmental Science', author: 'Erach Bharucha', semester: '2' },
    // Sem 3
    { name: 'Data Structures and Algorithms', author: 'Thomas H. Cormen', semester: '3' },
    { name: 'Java Programming', author: 'Herbert Schildt', semester: '3' },
    { name: 'Digital Logic Design', author: 'Morris Mano', semester: '3' },
    { name: 'Discrete Mathematics', author: 'Kenneth H. Rosen', semester: '3' },
    { name: 'Object-Oriented Programming', author: 'E. Balagurusamy', semester: '3' },
    // Sem 4
    { name: 'Operating System Concepts', author: 'Abraham Silberschatz', semester: '4' },
    { name: 'Database Management Systems', author: 'Raghu Ramakrishnan', semester: '4' },
    { name: 'Computer Networks', author: 'Andrew S. Tanenbaum', semester: '4' },
    { name: 'Theory of Computation', author: 'Michael Sipser', semester: '4' },
    { name: 'Software Engineering', author: 'Ian Sommerville', semester: '4' },
    // Sem 5
    { name: 'Artificial Intelligence', author: 'Stuart Russell', semester: '5' },
    { name: 'Web Technologies', author: 'Jeffrey C. Jackson', semester: '5' },
    { name: 'Design and Analysis of Algorithms', author: 'Ellis Horowitz', semester: '5' },
    { name: 'Computer Architecture', author: 'David A. Patterson', semester: '5' },
    { name: 'Microprocessors', author: 'Ramesh Gaonkar', semester: '5' },
    // Sem 6
    { name: 'Machine Learning Fundamentals', author: 'Tom M. Mitchell', semester: '6' },
    { name: 'Cloud Computing', author: 'Rajkumar Buyya', semester: '6' },
    { name: 'Cryptography and Network Security', author: 'William Stallings', semester: '6' },
    { name: 'Compiler Design', author: 'Alfred V. Aho', semester: '6' },
    { name: 'Internet of Things', author: 'Arshdeep Bahga', semester: '6' }
  ];

  for (let b of booksData) {
    await prisma.book.create({
      data: {
        name: b.name,
        author: b.author,
        semester: b.semester,
        availabilityStatus: 'AVAILABLE'
      }
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
