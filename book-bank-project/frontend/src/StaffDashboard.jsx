import React, { useState, useEffect } from 'react';
import { Users, ClipboardList, LogOut, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function StaffDashboard() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ totalBooks: 0, users: 0 });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };

  useEffect(() => {
    if (!user.id || user.role !== 'STAFF') navigate('/');
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const resRequests = await axios.get('http://127.0.0.1:5000/api/requests', { headers });
      setRequests(resRequests.data);
      
      const resBooks = await axios.get('http://127.0.0.1:5000/api/books', { headers });
      setStats({ totalBooks: resBooks.data.length, users: 4 }); // Users mock for now
    } catch (e) {
      if (e.response && e.response.status === 401) navigate('/');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await axios.put(`http://127.0.0.1:5000/api/requests/${id}/status`, { status }, { headers });
      fetchData();
    } catch (e) {
      alert("Error updating request status");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const pendingRequests = requests.filter(r => r.status === 'PENDING');

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Users size={32} color="var(--primary-color)" />
          <h2>Staff Portal</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Welcome, Administrator</span>
          <button className="btn btn-secondary" onClick={handleLogout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <h3>Total Books</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{stats.totalBooks}</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <h3>Pending Requests</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--warning-color)' }}>{pendingRequests.length}</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <h3>Completed Logs</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success-color)' }}>{requests.filter(r => r.status !== 'PENDING').length}</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardList size={24} /> Library Book Requests
          </h3>
          <button className="btn btn-secondary" onClick={fetchData}>Refresh Data</button>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: '1rem' }}>Student Details</th>
                <th style={{ padding: '1rem' }}>Book Requested</th>
                <th style={{ padding: '1rem' }}>Semester</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No requests in the system currently.</td>
                </tr>
              )}
              {requests.map(req => (
                <tr key={req.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>{req.student.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ref: {req.student.studentRef || 'N/A'} | {req.student.email}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>{req.book.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{req.book.author}</div>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{req.book.semester}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      backgroundColor: req.status === 'PENDING' ? 'rgba(245, 158, 11, 0.2)' : 
                                       req.status === 'APPROVED' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: req.status === 'PENDING' ? 'var(--warning-color)' : 
                             req.status === 'APPROVED' ? 'var(--success-color)' : 'var(--danger-color)'
                    }}>
                      {req.status}
                    </span>
                    {req.status === 'APPROVED' && req.returnDate && (
                      <div style={{ fontSize: '0.75rem', marginTop: '0.2rem', color: 'var(--text-secondary)' }}>Due: {new Date(req.returnDate).toLocaleDateString()}</div>
                    )}
                  </td>
                  <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                    {req.status === 'PENDING' ? (
                      <>
                        <button onClick={() => handleStatusChange(req.id, 'APPROVED')} className="btn btn-primary" style={{ backgroundColor: 'var(--success-color)', padding: '0.5rem' }}><CheckCircle size={16} /> Approve</button>
                        <button onClick={() => handleStatusChange(req.id, 'REJECTED')} className="btn btn-primary" style={{ backgroundColor: 'var(--danger-color)', padding: '0.5rem' }}><XCircle size={16} /> Reject</button>
                      </>
                    ) : req.status === 'APPROVED' ? (
                      <button onClick={() => handleStatusChange(req.id, 'RETURNED')} className="btn btn-secondary" style={{ padding: '0.5rem' }}>Mark Returned</button>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Resolved</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
