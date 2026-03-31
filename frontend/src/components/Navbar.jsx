import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import API from '../api/axios';

export default function Navbar() {
  const { user, logout, darkMode, toggleDark } = useAuth();
  const navigate = useNavigate();
  const [overBudget,     setOverBudget]     = useState(0);
  const [friendRequests, setFriendRequests] = useState(0);
  const [menuOpen,       setMenuOpen]       = useState(false);

  useEffect(() => {
    const now = new Date();
    API.get(`/budgets/status?month=${now.getMonth()+1}&year=${now.getFullYear()}`)
      .then(res => setOverBudget(res.data.filter(b => b.is_over).length))
      .catch(() => {});
    API.get('/friends/requests')
      .then(res => setFriendRequests(res.data.length))
      .catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); setMenuOpen(false); };
  const navBg = darkMode ? '#1F2937' : '#2563EB';

  const navLinks = [
    { to: '/dashboard',    label: 'Dashboard' },
    { to: '/transactions', label: 'Transactions' },
    { to: '/budgets',      label: 'Budgets', badge: overBudget },
    { to: '/splits',       label: 'Splits' },
    { to: '/friends',      label: 'Friends', badge: friendRequests },
    { to: '/goals',        label: 'Goals' },
    { to: '/ai',           label: 'AI Chat' },
  ];

  return (
    <>
      <nav style={{
        background: navBg, color: 'white', padding: '0 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        height: '56px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        {/* Logo */}
        <Link to="/dashboard" onClick={() => setMenuOpen(false)} style={{
          color: 'white', textDecoration: 'none', fontSize: '20px', fontWeight: 800
        }}>
          💰 CampusCash
        </Link>

        {/* Desktop links */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px',
          '@media (max-width: 768px)': { display: 'none' }
        }} className="desktop-nav">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} style={{
              color: 'white', textDecoration: 'none', opacity: 0.9,
              position: 'relative', padding: '4px 0'
            }}>
              {link.label}
              {link.badge > 0 && (
                <span style={{
                  position: 'absolute', top: '-8px', right: '-10px',
                  background: '#EF4444', color: 'white', borderRadius: '50%',
                  width: '16px', height: '16px', fontSize: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
                }}>{link.badge}</span>
              )}
            </Link>
          ))}
          <span style={{ opacity: 0.3 }}>|</span>
          <Link to="/profile" style={{ color: 'white', textDecoration: 'none', fontWeight: 600, fontSize: '13px' }}>
            {user?.name?.split(' ')[0]}
          </Link>
          <button onClick={toggleDark} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '20px',
            padding: '5px 10px', cursor: 'pointer', fontSize: '14px', color: 'white'
          }}>
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button onClick={handleLogout} style={{
            background: 'white', color: '#2563EB', border: 'none',
            borderRadius: '8px', padding: '6px 14px', cursor: 'pointer',
            fontWeight: 700, fontSize: '12px'
          }}>
            Logout
          </button>
        </div>

        {/* Mobile right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} className="mobile-nav">
          <button onClick={toggleDark} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '20px',
            padding: '5px 10px', cursor: 'pointer', fontSize: '14px', color: 'white'
          }}>
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'white', fontSize: '22px', padding: '4px', lineHeight: 1
            }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: '56px', left: 0, right: 0, bottom: 0,
          background: navBg, zIndex: 99, overflowY: 'auto',
          display: 'flex', flexDirection: 'column', padding: '12px 0'
        }}>
          {/* User info */}
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px'
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px'
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ color: 'white', fontWeight: 700, margin: 0, fontSize: '15px' }}>{user?.name}</p>
              <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: '12px' }}>{user?.college || 'Student'}</p>
            </div>
          </div>

          {navLinks.map(link => (
            <Link
              key={link.to} to={link.to}
              onClick={() => setMenuOpen(false)}
              style={{
                color: 'white', textDecoration: 'none', padding: '14px 20px',
                fontSize: '15px', fontWeight: 500, display: 'flex',
                alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.06)'
              }}
            >
              <span>{link.label}</span>
              {link.badge > 0 && (
                <span style={{
                  background: '#EF4444', color: 'white', borderRadius: '20px',
                  padding: '2px 8px', fontSize: '11px', fontWeight: 700
                }}>{link.badge} new</span>
              )}
            </Link>
          ))}

          <Link to="/profile" onClick={() => setMenuOpen(false)} style={{
            color: 'white', textDecoration: 'none', padding: '14px 20px',
            fontSize: '15px', fontWeight: 500,
            borderBottom: '1px solid rgba(255,255,255,0.06)'
          }}>
            Profile Settings
          </Link>

          <button onClick={handleLogout} style={{
            margin: '16px 20px', padding: '13px', background: 'rgba(255,255,255,0.15)',
            color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px',
            cursor: 'pointer', fontSize: '15px', fontWeight: 600
          }}>
            Logout
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-nav  { display: flex !important; }
        }
        @media (min-width: 769px) {
          .desktop-nav { display: flex !important; }
          .mobile-nav  { display: none !important; }
        }
      `}</style>
    </>
  );
}