import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import API from '../api/axios';

export default function Navbar() {
  const { user, logout, darkMode, toggleDark } = useAuth();
  const navigate = useNavigate();
  const [overBudget, setOverBudget] = useState(0);
  const [friendRequests, setFriendRequests] = useState(0);

  useEffect(() => {
    const now = new Date();
    API.get(`/budgets/status?month=${now.getMonth()+1}&year=${now.getFullYear()}`)
      .then(res => setOverBudget(res.data.filter(b => b.is_over).length))
      .catch(() => {});
  }, []);

useEffect(() => {
  // existing budget status fetch...
  API.get('/friends/requests')
    .then(res => setFriendRequests(res.data.length))
    .catch(() => {});
}, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navBg   = darkMode ? '#1F2937' : '#2563EB';
  const navText = '#FFFFFF';

  return (
    <nav style={{
      background: navBg, color: navText,
      padding: '12px 24px', display: 'flex',
      justifyContent: 'space-between', alignItems: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
    }}>
      <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none', fontSize: '20px', fontWeight: 700 }}>
        CampusCash
      </Link>
      <Link to="/goals" style={{ color:'white', textDecoration:'none', opacity:0.9 }}>Goals</Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '14px' }}>
        <Link to="/dashboard"    style={{ color: 'white', textDecoration: 'none', opacity: 0.9 }}>Dashboard</Link>
        <Link to="/transactions" style={{ color: 'white', textDecoration: 'none', opacity: 0.9 }}>Transactions</Link>
        <Link to="/budgets" style={{ color: 'white', textDecoration: 'none', opacity: 0.9, position: 'relative' }}>
          Budgets
          {overBudget > 0 && (
            <span style={{
              position: 'absolute', top: '-8px', right: '-10px',
              background: '#EF4444', color: 'white', borderRadius: '50%',
              width: '16px', height: '16px', fontSize: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
            }}>{overBudget}</span>
          )}
        </Link>
        <Link to="/friends" style={{ color:'white', textDecoration:'none', opacity:0.9, position:'relative' }}>
  Friends
  {friendRequests > 0 && (
    <span style={{
      position:'absolute', top:'-8px', right:'-10px',
      background:'#EF4444', color:'white', borderRadius:'50%',
      width:'16px', height:'16px', fontSize:'10px',
      display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700
    }}>{friendRequests}</span>
  )}
</Link>
        <Link to="/splits"  style={{ color: 'white', textDecoration: 'none', opacity: 0.9 }}>Splits</Link>
        <Link to="/ai"      style={{ color: 'white', textDecoration: 'none', opacity: 0.9 }}>AI Chat</Link>
        <span style={{ opacity: 0.4 }}>|</span>
        <Link to="/profile" style={{ color: 'white', textDecoration: 'none', fontWeight: 600 }}>{user?.name}</Link>
        <button onClick={toggleDark} style={{
          background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '20px',
          padding: '6px 12px', cursor: 'pointer', fontSize: '14px', color: 'white'
        }}>
          {darkMode ? '☀️' : '🌙'}
        </button>
        <button onClick={handleLogout} style={{
          background: 'white', color: '#2563EB', border: 'none',
          borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '13px'
        }}>
          Logout
        </button>
      </div>
    </nav>
  );
}