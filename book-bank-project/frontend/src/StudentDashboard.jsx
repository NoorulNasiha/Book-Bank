import React, { useState, useEffect } from 'react';
import { Book, Clock, AlertCircle, Search, LogOut, CalendarCheck, BookUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [availableBooks, setAvailableBooks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [fines, setFines] = useState([]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };

  useEffect(() => {
    if (!user.id || user.role !== 'STUDENT') navigate('/');
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const bReq = axios.get('http://127.0.0.1:5000/api/books', { headers });
      const rReq = axios.get('http://127.0.0.1:5000/api/requests', { headers });
      const fReq = axios.get('http://127.0.0.1:5000/api/fines', { headers });
      const [resBooks, resRequests, resFines] = await Promise.all([bReq, rReq, fReq]);
      
      setAvailableBooks(resBooks.data);
      setRequests(resRequests.data);
      setFines(resFines.data);
    } catch (e) {
      console.error(e);
      if (e.response && e.response.status === 401) navigate('/');
    }
  };

  const handleRequest = async (bookId) => {
    try {
      await axios.post('http://127.0.0.1:5000/api/requests', { bookId }, { headers });
      alert("Book requested successfully!");
      fetchData();
    } catch (e) {
      alert(e.response?.data?.error || "Error requesting book");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const filteredBooks = availableBooks.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.semester.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const approvedRequests = requests.filter(r => r.status === 'APPROVED');

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Book size={32} color="var(--primary-color)" />
          <h2>Student Portal - Semesters 1 to 6</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Welcome, {user.name}</span>
          <button className="btn btn-secondary" onClick={handleLogout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={20} /> Active Requests</h3>
          <p style={{ color: 'var(--text-secondary)' }}>You have <strong style={{ color: 'var(--warning-color)' }}>{pendingCount}</strong> requests pending approval.</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderColor: fines.length > 0 ? 'rgba(239, 68, 68, 0.3)' : 'var(--glass-border)' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: fines.length > 0 ? 'var(--danger-color)' : 'inherit' }}><AlertCircle size={20} /> Outstanding Fines</h3>
          {fines.filter(f => f.status === 'UNPAID').length > 0 ? (
            <div>
              {fines.filter(f => f.status === 'UNPAID').map(f => (
                <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)' }}>
                  <span>{f.book.name}</span>
                  <strong style={{ color: 'var(--danger-color)' }}>₹{f.amount}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>No outstanding fines. Great job!</p>
          )}
        </div>
      </div>

      {/* Approved Books Section */}
      {approvedRequests.length > 0 && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success-color)' }}>
            <CalendarCheck size={24} /> Currently Borrowed Books
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {approvedRequests.map(req => (
              <div key={req.id} className="glass-card" style={{ padding: '1rem' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>{req.book.name}</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Author: {req.book.author}</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--warning-color)', marginBottom: '0.5rem' }}>
                  <strong>Return Due: </strong> {new Date(req.returnDate).toLocaleDateString()}
                </p>
                <div style={{ marginTop: '0.5rem', background: 'rgba(34, 197, 94, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px', display: 'inline-block', fontSize: '0.75rem', color: 'var(--success-color)' }}>
                  Approved
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Book Browsing */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BookUp size={24} /> Request Books</h3>
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="input-field" 
              style={{ paddingLeft: '2.5rem' }} 
              placeholder="Search by name, author, or sem..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {filteredBooks.map(book => {
            const alreadyRequested = requests.find(r => r.bookId === book.id && (r.status === 'PENDING' || r.status === 'APPROVED'));
            return (
              <div key={book.id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, background: 'var(--primary-color)', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>Sem {book.semester}</span>
                  {book.availabilityStatus === 'AVAILABLE' ? 
                    <span style={{ fontSize: '0.75rem', color: 'var(--success-color)' }}>Available</span> : 
                    <span style={{ fontSize: '0.75rem', color: 'var(--danger-color)' }}>Borrowed</span>
                  }
                </div>
                <h4 style={{ marginBottom: '0.25rem', flex: 1 }}>{book.name}</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>{book.author}</p>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '0.5rem' }}
                  disabled={book.availabilityStatus !== 'AVAILABLE' || alreadyRequested}
                  onClick={() => handleRequest(book.id)}
                >
                  {alreadyRequested ? 'Already Requested' : (book.availabilityStatus === 'AVAILABLE' ? 'Request Book' : 'Unavailable')}
                </button>
              </div>
            );
          })}
          {filteredBooks.length === 0 && <p style={{ gridColumn: '1 / -1', color: 'var(--text-secondary)' }}>No books found matching your search.</p>}
        </div>
      </div>
    </div>
  );
}
