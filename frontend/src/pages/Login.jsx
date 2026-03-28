import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate  = useNavigate();
  const { login } = useAuth();
  const [form,    setForm]    = useState({ email:'', password:'' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.append('username', form.email);
      params.append('password', form.password);
      const res     = await API.post('/auth/login', params);
      const token   = res.data.access_token;
      const userRes = await API.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      login(token, userRes.data);
      navigate('/dashboard');
    } catch {
      setError('Invalid email or password. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 50%, #FFF7ED 100%)'
    }}>

      {/* Left panel */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '60px',
        background: '#1E40AF', color: 'white',
        display: window.innerWidth < 768 ? 'none' : 'flex'
      }}>
        <div style={{ maxWidth: '420px' }}>
          <div style={{ fontSize: '42px', marginBottom: '16px' }}>💰</div>
          <h1 style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 16px', lineHeight: 1.2 }}>
            CampusCash
          </h1>
          <p style={{ fontSize: '18px', opacity: 0.85, margin: '0 0 40px', lineHeight: 1.6 }}>
            AI-powered finance manager built for hostel students
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { icon: '🤖', text: 'AI that knows your spending habits' },
              { icon: '🔥', text: 'Daily streaks to stay motivated' },
              { icon: '👥', text: 'Split bills with friends easily' },
              { icon: '🎯', text: 'Save towards your goals' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '22px' }}>{item.icon}</span>
                <span style={{ fontSize: '15px', opacity: 0.9 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '24px'
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

          {/* Mobile logo */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span style={{ fontSize: '36px' }}>💰</span>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1E40AF', margin: '8px 0 4px' }}>
              CampusCash
            </h1>
            <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>
              Welcome back! Log in to your account
            </p>
          </div>

          <div style={{
            background: 'white', borderRadius: '20px', padding: '36px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
            border: '1px solid rgba(37,99,235,0.08)'
          }}>

            {error && (
              <div style={{
                background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px',
                padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#DC2626',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                  Email address
                </label>
                <input
                  type="email" required placeholder="you@college.edu"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  style={{
                    width: '100%', padding: '12px 16px', fontSize: '14px',
                    border: '1.5px solid #E5E7EB', borderRadius: '10px', outline: 'none',
                    boxSizing: 'border-box', transition: 'border-color 0.2s',
                    fontFamily: 'inherit'
                  }}
                  onFocus={e => e.target.style.borderColor = '#2563EB'}
                  onBlur={e  => e.target.style.borderColor = '#E5E7EB'}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'} required placeholder="Enter your password"
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                    style={{
                      width: '100%', padding: '12px 44px 12px 16px', fontSize: '14px',
                      border: '1.5px solid #E5E7EB', borderRadius: '10px', outline: 'none',
                      boxSizing: 'border-box', transition: 'border-color 0.2s',
                      fontFamily: 'inherit'
                    }}
                    onFocus={e => e.target.style.borderColor = '#2563EB'}
                    onBlur={e  => e.target.style.borderColor = '#E5E7EB'}
                  />
                  <button
                    type="button" onClick={() => setShowPass(!showPass)}
                    style={{
                      position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#9CA3AF'
                    }}
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '13px', fontSize: '15px', fontWeight: 700,
                  background: loading ? '#93C5FD' : '#2563EB', color: 'white',
                  border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s', marginTop: '4px', fontFamily: 'inherit',
                  boxShadow: loading ? 'none' : '0 4px 12px rgba(37,99,235,0.3)'
                }}
                onMouseEnter={e => { if (!loading) e.target.style.background = '#1D4ED8'; }}
                onMouseLeave={e => { if (!loading) e.target.style.background = '#2563EB'; }}
              >
                {loading ? 'Logging in...' : 'Login →'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <span style={{ fontSize: '14px', color: '#6B7280' }}>
                Don't have an account?{' '}
                <Link to="/register" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>
                  Create one free
                </Link>
              </span>
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: '12px', color: '#9CA3AF', marginTop: '24px' }}>
            Built for Indian college students 🇮🇳
          </p>
        </div>
      </div>
    </div>
  );
}