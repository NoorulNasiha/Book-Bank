import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, User, Lock, Briefcase } from 'lucide-react';

export default function Login() {
  const [roleMode, setRoleMode] = useState('STUDENT'); // 'STUDENT' or 'STAFF'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('http://127.0.0.1:5000/api/auth/login', { email, password });
      
      const { user, token } = res.data;
      if (user.role !== roleMode) {
        setError(`Please login through the ${user.role} portal.`);
        return;
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      if (user.role === 'STAFF') {
        navigate('/staff');
      } else {
        navigate('/student');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Provide correct email/password.');
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', marginTop: '-50px' }}>
      <div className="glass-card" style={{ padding: '2.5rem', width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <BookOpen size={48} color="var(--primary-color)" style={{ marginBottom: '1rem' }} />
          <h2>Book Bank Portal</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Access your college library</p>
        </div>

        {/* Role Toggle Selector */}
        <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.6)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
          <button 
            type="button"
            onClick={() => { setRoleMode('STUDENT'); setEmail('student@school.edu'); setPassword('studentpass'); setError(''); }}
            style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, background: roleMode === 'STUDENT' ? 'var(--primary-color)' : 'transparent', color: roleMode === 'STUDENT' ? 'white' : 'var(--text-secondary)' }}
          >
            <User size={16} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} /> Student
          </button>
          <button 
            type="button"
            onClick={() => { setRoleMode('STAFF'); setEmail('admin@bookbank.com'); setPassword('staffpass'); setError(''); }}
            style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, background: roleMode === 'STAFF' ? 'var(--primary-color)' : 'transparent', color: roleMode === 'STAFF' ? 'white' : 'var(--text-secondary)' }}
          >
            <Briefcase size={16} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} /> Staff
          </button>
        </div>

        {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label className="input-label">Email</label>
            <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-secondary)' }} />
              <input type="email" required className="input-field" style={{ paddingLeft: '2.5rem' }} placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-secondary)' }} />
              <input type="password" required className="input-field" style={{ paddingLeft: '2.5rem' }} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', fontSize: '1rem' }}>
            Login to {roleMode === 'STUDENT' ? 'Student' : 'Staff'} Portal
          </button>
        </form>
      </div>
    </div>
  );
}
