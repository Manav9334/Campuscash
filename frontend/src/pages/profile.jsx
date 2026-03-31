import { useState } from 'react';
import Navbar from '../components/Navbar';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, setUser, darkMode } = useAuth();
  const [allowance, setAllowance] = useState(user?.monthly_allowance || '');
  const [name,      setName]      = useState(user?.name || '');
  const [college,   setCollege]   = useState(user?.college || '');
  const [saved,     setSaved]     = useState(false);
  const [loading,   setLoading]   = useState(false);

  const [currPass,  setCurrPass]  = useState('');
  const [newPass,   setNewPass]   = useState('');
  const [confPass,  setConfPass]  = useState('');
  const [passMsg,   setPassMsg]   = useState(null);
  const [passLoading, setPassLoading] = useState(false);

  const bg     = darkMode ? '#111827' : '#F9FAFB';
  const card   = darkMode ? '#1F2937' : '#FFFFFF';
  const text   = darkMode ? '#F9FAFB' : '#111827';
  const sub    = darkMode ? '#9CA3AF' : '#6B7280';
  const border = darkMode ? '#374151' : '#E5E7EB';
  const inputBg = darkMode ? '#374151' : '#FFFFFF';

  const inputStyle = {
    width: '100%', border: `1px solid ${border}`, borderRadius: '8px',
    padding: '10px 14px', fontSize: '14px', outline: 'none',
    background: inputBg, color: text, boxSizing: 'border-box'
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.put('/auth/profile', {
        name, college, monthly_allowance: parseFloat(allowance)
      });
      const updated = { ...user, name, college, monthly_allowance: parseFloat(allowance) };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Error updating profile');
    }
    setLoading(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPass !== confPass) {
      setPassMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (newPass.length < 6) {
      setPassMsg({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    setPassLoading(true);
    try {
      await API.put('/auth/change-password', {
        current_password: currPass,
        new_password:     newPass
      });
      setPassMsg({ type: 'success', text: 'Password changed successfully!' });
      setCurrPass(''); setNewPass(''); setConfPass('');
      setTimeout(() => setPassMsg(null), 3000);
    } catch (err) {
      setPassMsg({ type: 'error', text: err.response?.data?.detail || 'Error changing password' });
    }
    setPassLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text }}>
      <Navbar />
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: 'clamp(16px, 4vw, 24px)' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 20px', color: text }}>Profile Settings</h2>

        {/* Profile card */}
        <div style={{ background: card, borderRadius: '12px', padding: '24px', border: `1px solid ${border}`, marginBottom: '16px' }}>

          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#2563EB', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '24px', fontWeight: 700, color: 'white'
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: '16px', margin: 0, color: text }}>{user?.name}</p>
              <p style={{ fontSize: '13px', color: sub, margin: '2px 0 0' }}>{user?.email}</p>
            </div>
          </div>

          {saved && (
            <div style={{
              background: darkMode ? '#052E16' : '#F0FDF4', border: '1px solid #86EFAC',
              borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#16A34A'
            }}>
              Profile updated successfully!
            </div>
          )}

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '13px', color: sub, display: 'block', marginBottom: '6px' }}>Full name</label>
              <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: sub, display: 'block', marginBottom: '6px' }}>College</label>
              <input value={college} onChange={e => setCollege(e.target.value)} placeholder="Your college name" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: sub, display: 'block', marginBottom: '6px' }}>
                Monthly allowance (₹)
              </label>
              <input
                type="number" value={allowance}
                onChange={e => setAllowance(e.target.value)}
                placeholder="e.g. 8000" style={inputStyle}
              />
              <p style={{ fontSize: '12px', color: sub, margin: '4px 0 0' }}>
                Updates all budget calculations on dashboard instantly
              </p>
            </div>
            <button type="submit" disabled={loading} style={{
              background: '#2563EB', color: 'white', border: 'none',
              borderRadius: '8px', padding: '12px', cursor: 'pointer',
              fontWeight: 600, fontSize: '14px', opacity: loading ? 0.6 : 1
            }}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change Password card */}
        <div style={{ background: card, borderRadius: '12px', padding: '24px', border: `1px solid ${border}` }}>
          <h3 style={{ fontWeight: 600, fontSize: '16px', margin: '0 0 16px', color: text }}>
            Change Password
          </h3>

          {passMsg && (
            <div style={{
              background: passMsg.type === 'success' ? (darkMode ? '#052E16' : '#F0FDF4') : (darkMode ? '#450A0A' : '#FEF2F2'),
              border: `1px solid ${passMsg.type === 'success' ? '#86EFAC' : '#FECACA'}`,
              borderRadius: '8px', padding: '10px 14px', marginBottom: '14px',
              fontSize: '13px', color: passMsg.type === 'success' ? '#16A34A' : '#EF4444'
            }}>
              {passMsg.text}
            </div>
          )}

          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '13px', color: sub, display: 'block', marginBottom: '6px' }}>Current password</label>
              <input
                type="password" value={currPass} required
                onChange={e => setCurrPass(e.target.value)}
                placeholder="Enter current password" style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: sub, display: 'block', marginBottom: '6px' }}>New password</label>
              <input
                type="password" value={newPass} required
                onChange={e => setNewPass(e.target.value)}
                placeholder="Min 6 characters" style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: sub, display: 'block', marginBottom: '6px' }}>Confirm new password</label>
              <input
                type="password" value={confPass} required
                onChange={e => setConfPass(e.target.value)}
                placeholder="Repeat new password" style={inputStyle}
              />
            </div>
            <button type="submit" disabled={passLoading} style={{
              background: darkMode ? '#374151' : '#1F2937', color: 'white', border: 'none',
              borderRadius: '8px', padding: '12px', cursor: 'pointer',
              fontWeight: 600, fontSize: '14px', opacity: passLoading ? 0.6 : 1
            }}>
              {passLoading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}