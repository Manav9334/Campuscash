import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Splits() {
  const { user, darkMode } = useAuth();
  const [splits,          setSplits]          = useState([]);
  const [categories,      setCategories]      = useState([]);
  const [friends,         setFriends]         = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [form,    setForm]    = useState({
    description: '', total_amount: '', date: '', category_id: ''
  });
  const [loading,   setLoading]   = useState(false);
  const [perPerson, setPerPerson] = useState(null);

  const bg      = darkMode ? '#111827' : '#F9FAFB';
  const card    = darkMode ? '#1F2937' : '#FFFFFF';
  const text    = darkMode ? '#F9FAFB' : '#111827';
  const sub     = darkMode ? '#9CA3AF' : '#6B7280';
  const border  = darkMode ? '#374151' : '#E5E7EB';
  const inputBg = darkMode ? '#374151' : '#FFFFFF';

  const inputStyle = {
    width: '100%', border: `1px solid ${border}`, borderRadius: '8px',
    padding: '8px 12px', fontSize: '13px', outline: 'none',
    background: inputBg, color: text, boxSizing: 'border-box'
  };

  const fetchSplits = () => {
    API.get('/splits/my').then(res => setSplits(res.data)).catch(() => {});
  };

  useEffect(() => {
    fetchSplits();
    API.get('/categories/').then(res => setCategories(res.data)).catch(() => {});
    API.get('/friends/list').then(res => setFriends(res.data)).catch(() => {});
  }, []);

  const toggleFriend = (friend) => {
    setSelectedFriends(prev => {
      const exists = prev.find(f => f.id === friend.id);
      if (exists) return prev.filter(f => f.id !== friend.id);
      return [...prev, friend];
    });
  };

  const totalPeople  = selectedFriends.length + 1; // +1 for current user
  const shareAmount  = form.total_amount && totalPeople > 0
    ? Math.round(parseFloat(form.total_amount) / totalPeople) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFriends.length === 0) {
      alert('Select at least one friend to split with');
      return;
    }
    setLoading(true);
    try {
      const memberIds = [user.id, ...selectedFriends.map(f => f.id)];
      const res = await API.post('/splits/', {
        description:  form.description,
        total_amount: parseFloat(form.total_amount),
        date:         form.date,
        member_ids:   memberIds
      });
      setPerPerson(res.data.per_person);
      setForm({ description:'', total_amount:'', date:'', category_id:'' });
      setSelectedFriends([]);
      fetchSplits();
    } catch (err) {
      alert(`Error: ${err.response?.data?.detail || 'Could not create split'}`);
    }
    setLoading(false);
  };

  const markPaid = async (splitId) => {
    await API.put(`/splits/${splitId}/pay`);
    fetchSplits();
  };

  const markUnpaid = async (splitId) => {
    await API.put(`/splits/${splitId}/unpay`);
    fetchSplits();
  };

  const deleteSplit = async (splitId) => {
    if (!window.confirm('Remove this split from your list?')) return;
    await API.delete(`/splits/${splitId}`);
    fetchSplits();
  };

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text }}>
      <Navbar />
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 4px', color: text }}>
          Split Expenses
        </h2>
        <p style={{ color: sub, fontSize: '14px', margin: '0 0 20px' }}>
          Split bills with your friends fairly
        </p>

        {perPerson && (
          <div style={{
            background: darkMode ? '#052E16' : '#F0FDF4', border: '1px solid #86EFAC',
            borderRadius: '10px', padding: '12px 16px', marginBottom: '16px',
            fontSize: '13px', color: '#16A34A', fontWeight: 500
          }}>
            Split created! Each person owes <strong>₹{perPerson}</strong>
          </div>
        )}

        {/* Create split form */}
        <div style={{
          background: card, borderRadius: '12px', padding: '20px',
          border: `1px solid ${border}`, marginBottom: '20px'
        }}>
          <h3 style={{ fontWeight: 600, fontSize: '15px', margin: '0 0 16px', color: text }}>
            Create a split
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              <input
                placeholder="What's this for? (e.g. Electricity bill)" required
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                style={inputStyle}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input
                  type="number" placeholder="Total amount (₹)" required
                  value={form.total_amount}
                  onChange={e => setForm({...form, total_amount: e.target.value})}
                  style={inputStyle}
                />
                <input
                  type="date" required value={form.date}
                  onChange={e => setForm({...form, date: e.target.value})}
                  style={inputStyle}
                />
              </div>

              <select
                value={form.category_id}
                onChange={e => setForm({...form, category_id: e.target.value})}
                style={inputStyle}
              >
                <option value="">Select category (optional)</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {/* Friend picker */}
              <div>
                <p style={{ fontSize: '13px', color: sub, margin: '0 0 8px', fontWeight: 500 }}>
                  Split with (select friends):
                </p>
                {friends.length === 0 ? (
                  <div style={{
                    padding: '12px', borderRadius: '8px', textAlign: 'center',
                    background: darkMode ? '#374151' : '#F9FAFB',
                    border: `1px dashed ${border}`, fontSize: '13px', color: sub
                  }}>
                    No friends yet —{' '}
                    <a href="/friends" style={{ color: '#2563EB', textDecoration: 'none' }}>
                      add friends first
                    </a>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Current user — always included */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 12px', borderRadius: '8px',
                      background: darkMode ? '#1E3A5F' : '#EFF6FF',
                      border: '1px solid #BFDBFE'
                    }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: '#2563EB', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: '13px'
                      }}>
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: text }}>
                          {user?.name} (you)
                        </p>
                      </div>
                      <span style={{
                        fontSize: '11px', background: '#2563EB', color: 'white',
                        padding: '2px 8px', borderRadius: '20px'
                      }}>Always included</span>
                    </div>

                    {/* Friends list */}
                    {friends.map(f => {
                      const selected = selectedFriends.find(sf => sf.id === f.id);
                      return (
                        <div
                          key={f.id}
                          onClick={() => toggleFriend(f)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                            background: selected
                              ? (darkMode ? '#052E16' : '#F0FDF4')
                              : (darkMode ? '#374151' : '#F9FAFB'),
                            border: `1px solid ${selected ? '#86EFAC' : border}`,
                            transition: 'all 0.15s'
                          }}
                        >
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: selected ? '#10B981' : (darkMode ? '#4B5563' : '#E5E7EB'),
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontWeight: 700,
                            color: selected ? 'white' : text, fontSize: '13px',
                            transition: 'all 0.15s'
                          }}>
                            {f.name?.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: text }}>
                              {f.name}
                            </p>
                            <p style={{ fontSize: '11px', color: sub, margin: 0 }}>
                              {f.college || f.email}
                            </p>
                          </div>
                          <div style={{
                            width: '20px', height: '20px', borderRadius: '50%',
                            border: `2px solid ${selected ? '#10B981' : border}`,
                            background: selected ? '#10B981' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '12px', color: 'white', transition: 'all 0.15s'
                          }}>
                            {selected && '✓'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Share preview */}
              {selectedFriends.length > 0 && shareAmount > 0 && (
                <div style={{
                  background: darkMode ? '#1E3A5F' : '#EFF6FF',
                  border: '1px solid #BFDBFE', borderRadius: '8px', padding: '12px'
                }}>
                  <p style={{ fontSize: '13px', color: '#1D4ED8', fontWeight: 500, margin: '0 0 6px' }}>
                    Split preview
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: text }}>
                    <span>Total amount</span>
                    <span>₹{parseFloat(form.total_amount).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: text }}>
                    <span>Split between</span>
                    <span>{totalPeople} people</span>
                  </div>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: '14px', fontWeight: 700, color: '#2563EB',
                    marginTop: '6px', paddingTop: '6px',
                    borderTop: `1px solid ${darkMode ? '#374151' : '#BFDBFE'}`
                  }}>
                    <span>Each person pays</span>
                    <span>₹{shareAmount}</span>
                  </div>
                </div>
              )}

              <button
                type="submit" disabled={loading || selectedFriends.length === 0}
                style={{
                  background: selectedFriends.length === 0 ? (darkMode ? '#374151' : '#E5E7EB') : '#2563EB',
                  color: selectedFriends.length === 0 ? sub : 'white',
                  border: 'none', borderRadius: '8px', padding: '11px',
                  cursor: selectedFriends.length === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 600, fontSize: '14px', transition: 'all 0.2s'
                }}
              >
                {loading ? 'Creating...' : selectedFriends.length === 0
                  ? 'Select friends to split'
                  : `Create Split with ${totalPeople} people`}
              </button>
            </div>
          </form>
        </div>

        {/* Splits list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 style={{ fontWeight: 600, fontSize: '15px', margin: '0 0 4px', color: text }}>
            Your splits
          </h3>
          {splits.length === 0 ? (
            <div style={{
              textAlign: 'center', background: card, borderRadius: '12px',
              padding: '40px', color: sub, border: `1px solid ${border}`
            }}>
              No splits yet — create one above
            </div>
          ) : splits.map((s, i) => (
            <div key={i} style={{
              background: card, borderRadius: '12px', padding: '16px 20px',
              border: `1px solid ${border}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 2px', color: text }}>
                  {s.description || `Split #${s.split_id}`}
                </p>
                <p style={{ fontSize: '12px', color: sub, margin: '0 0 4px' }}>{s.date}</p>
                <p style={{ fontSize: '13px', color: '#EF4444', fontWeight: 500, margin: 0 }}>
                  You owe ₹{s.amount_owed}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {s.is_paid ? (
                  <>
                    <span style={{
                      fontSize: '12px', background: '#DCFCE7', color: '#16A34A',
                      padding: '4px 10px', borderRadius: '20px', fontWeight: 500
                    }}>Paid ✓</span>
                    <button onClick={() => markUnpaid(s.split_id)} style={{
                      fontSize: '11px', background: darkMode ? '#374151' : '#F3F4F6',
                      color: sub, border: 'none', borderRadius: '6px',
                      padding: '4px 8px', cursor: 'pointer'
                    }}>Undo</button>
                  </>
                ) : (
                  <button onClick={() => markPaid(s.split_id)} style={{
                    fontSize: '12px', background: '#2563EB', color: 'white',
                    border: 'none', borderRadius: '8px',
                    padding: '6px 14px', cursor: 'pointer', fontWeight: 500
                  }}>Mark paid</button>
                )}
                <button onClick={() => deleteSplit(s.split_id)} style={{
                  fontSize: '12px', background: darkMode ? '#450A0A' : '#FEF2F2',
                  color: '#EF4444', border: '1px solid #FECACA',
                  borderRadius: '8px', padding: '6px 10px', cursor: 'pointer'
                }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}