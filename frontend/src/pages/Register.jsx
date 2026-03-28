import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';

export default function Register() {
  const navigate  = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', college: '',
    hostel_room: '', monthly_allowance: ''
  });
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [step,     setStep]     = useState(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await API.post('/auth/register', {
        ...form,
        monthly_allowance: parseFloat(form.monthly_allowance)
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Try again.');
    }
    setLoading(false);
  };

  const inputStyle = {
    width: '100%', padding: '12px 16px', fontSize: '14px',
    border: '1.5px solid #E5E7EB', borderRadius: '10px', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s'
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '24px',
      background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 50%, #FFF7ED 100%)'
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span style={{ fontSize: '36px' }}>💰</span>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1E40AF', margin: '8px 0 4px' }}>
            Join CampusCash
          </h1>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>
            Set up your student finance account in 2 minutes
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
          {[1, 2].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700,
                background: step >= s ? '#2563EB' : '#E5E7EB',
                color: step >= s ? 'white' : '#9CA3AF'
              }}>{s}</div>
              <span style={{ fontSize: '13px', color: step >= s ? '#2563EB' : '#9CA3AF', fontWeight: step >= s ? 600 : 400 }}>
                {s === 1 ? 'Account' : 'College Info'}
              </span>
              {s < 2 && <div style={{ width: '40px', height: '2px', background: step > s ? '#2563EB' : '#E5E7EB' }} />}
            </div>
          ))}
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

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Full name</label>
                  <input
                    placeholder="Manav Sharma" required value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#2563EB'}
                    onBlur={e  => e.target.style.borderColor = '#E5E7EB'}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Email address</label>
                  <input
                    type="email" placeholder="you@college.edu" required value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#2563EB'}
                    onBlur={e  => e.target.style.borderColor = '#E5E7EB'}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'} placeholder="Min 6 characters" required
                      value={form.password}
                      onChange={e => setForm({...form, password: e.target.value})}
                      style={{ ...inputStyle, paddingRight: '44px' }}
                      onFocus={e => e.target.style.borderColor = '#2563EB'}
                      onBlur={e  => e.target.style.borderColor = '#E5E7EB'}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{
                      position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#9CA3AF'
                    }}>{showPass ? '🙈' : '👁️'}</button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!form.name || !form.email || !form.password) { setError('Please fill all fields'); return; }
                    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
                    setError(''); setStep(2);
                  }}
                  style={{
                    width: '100%', padding: '13px', fontSize: '15px', fontWeight: 700,
                    background: '#2563EB', color: 'white', border: 'none', borderRadius: '10px',
                    cursor: 'pointer', fontFamily: 'inherit', marginTop: '4px',
                    boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
                  }}
                >
                  Next →
                </button>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>College name</label>
                  <input
                    placeholder="e.g. NIT Jaipur" value={form.college}
                    onChange={e => setForm({...form, college: e.target.value})}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#2563EB'}
                    onBlur={e  => e.target.style.borderColor = '#E5E7EB'}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Hostel room <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(optional)</span>
                  </label>
                  <input
                    placeholder="e.g. A-204" value={form.hostel_room}
                    onChange={e => setForm({...form, hostel_room: e.target.value})}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#2563EB'}
                    onBlur={e  => e.target.style.borderColor = '#E5E7EB'}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Monthly allowance (₹)
                  </label>
                  <input
                    type="number" placeholder="e.g. 8000" required value={form.monthly_allowance}
                    onChange={e => setForm({...form, monthly_allowance: e.target.value})}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#2563EB'}
                    onBlur={e  => e.target.style.borderColor = '#E5E7EB'}
                  />
                  <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '5px 0 0' }}>
                    Used to calculate your daily budget and spending predictions
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button
                    type="button" onClick={() => setStep(1)}
                    style={{
                      flex: 1, padding: '13px', fontSize: '14px', fontWeight: 600,
                      background: '#F3F4F6', color: '#374151', border: 'none',
                      borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit'
                    }}
                  >
                    ← Back
                  </button>
                  <button
                    type="submit" disabled={loading}
                    style={{
                      flex: 2, padding: '13px', fontSize: '15px', fontWeight: 700,
                      background: loading ? '#93C5FD' : '#2563EB', color: 'white',
                      border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit', boxShadow: loading ? 'none' : '0 4px 12px rgba(37,99,235,0.3)'
                    }}
                  >
                    {loading ? 'Creating...' : 'Create Account 🎉'}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <span style={{ fontSize: '14px', color: '#6B7280' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>
                Login
              </Link>
            </span>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#9CA3AF', marginTop: '24px' }}>
          Built for Indian college students 🇮🇳 · Free forever
        </p>
      </div>
    </div>
  );
}