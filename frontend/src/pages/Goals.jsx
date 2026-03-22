import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const EMOJIS = ['🎯','📱','💻','✈️','🎮','👟','📚','🏍️','💰','🎸','🏋️','🛵'];

export default function Goals() {
  const { darkMode } = useAuth();
  const [goals,   setGoals]   = useState([]);
  const [form,    setForm]    = useState({ title:'', target_amount:'', emoji:'🎯', deadline:'' });
  const [deposit, setDeposit] = useState({});
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const bg     = darkMode ? '#111827' : '#F9FAFB';
  const card   = darkMode ? '#1F2937' : '#FFFFFF';
  const text   = darkMode ? '#F9FAFB' : '#111827';
  const sub    = darkMode ? '#9CA3AF' : '#6B7280';
  const border = darkMode ? '#374151' : '#E5E7EB';
  const inputBg = darkMode ? '#374151' : '#FFFFFF';

  const inputStyle = {
    border: `1px solid ${border}`, borderRadius: '8px', padding: '9px 12px',
    fontSize: '13px', outline: 'none', background: inputBg, color: text,
    width: '100%', boxSizing: 'border-box'
  };

  const fetchGoals = () => {
    API.get('/gamification/goals').then(res => setGoals(res.data)).catch(() => {});
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/gamification/goals', {
        ...form, target_amount: parseFloat(form.target_amount)
      });
      setForm({ title:'', target_amount:'', emoji:'🎯', deadline:'' });
      setShowForm(false);
      fetchGoals();
    } catch { alert('Error creating goal'); }
    setLoading(false);
  };

  const handleDeposit = async (goalId) => {
    const amt = parseFloat(deposit[goalId]);
    if (!amt || amt <= 0) return;
    try {
      const res = await API.put(`/gamification/goals/${goalId}/deposit`, { amount: amt });
      setDeposit(prev => ({ ...prev, [goalId]: '' }));
      fetchGoals();
      if (res.data.is_completed) {
        alert('🎉 Congratulations! You reached your savings goal!');
      }
    } catch { alert('Error depositing'); }
  };

  const handleDelete = async (goalId) => {
    if (!window.confirm('Delete this goal?')) return;
    await API.delete(`/gamification/goals/${goalId}`);
    fetchGoals();
  };

  const totalSaved  = goals.reduce((a, g) => a + g.saved_amount, 0);
  const totalTarget = goals.reduce((a, g) => a + g.target_amount, 0);
  const completed   = goals.filter(g => g.is_completed).length;

  return (
    <div style={{ minHeight:'100vh', background:bg, color:text }}>
      <Navbar />
      <div style={{ maxWidth:'720px', margin:'0 auto', padding:'24px' }}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
          <div>
            <h2 style={{ fontSize:'22px', fontWeight:700, margin:'0 0 4px', color:text }}>Savings Goals</h2>
            <p style={{ color:sub, fontSize:'14px', margin:0 }}>Track what you're saving towards</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{
            background:'#2563EB', color:'white', border:'none', borderRadius:'10px',
            padding:'10px 18px', cursor:'pointer', fontWeight:600, fontSize:'13px'
          }}>
            {showForm ? 'Cancel' : '+ New Goal'}
          </button>
        </div>

        {/* Summary */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px', marginBottom:'20px' }}>
          {[
            { label:'Total saved',    value:`₹${totalSaved.toLocaleString()}`,  color:'#10B981' },
            { label:'Total targeted', value:`₹${totalTarget.toLocaleString()}`, color:'#3B82F6' },
            { label:'Goals completed',value:`${completed} / ${goals.length}`,   color:'#F59E0B' },
          ].map((s, i) => (
            <div key={i} style={{ background:card, borderRadius:'10px', padding:'14px', border:`1px solid ${border}` }}>
              <p style={{ fontSize:'12px', color:sub, margin:'0 0 4px' }}>{s.label}</p>
              <p style={{ fontSize:'18px', fontWeight:700, color:s.color, margin:0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Create form */}
        {showForm && (
          <div style={{ background:card, borderRadius:'12px', padding:'20px', border:`1px solid ${border}`, marginBottom:'20px' }}>
            <h3 style={{ fontWeight:600, fontSize:'15px', margin:'0 0 14px', color:text }}>Create new goal</h3>
            <form onSubmit={handleCreate}>
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                <div>
                  <label style={{ fontSize:'12px', color:sub, display:'block', marginBottom:'5px' }}>Pick an emoji</label>
                  <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                    {EMOJIS.map(e => (
                      <button key={e} type="button" onClick={() => setForm({...form, emoji:e})} style={{
                        fontSize:'20px', padding:'6px', borderRadius:'8px', cursor:'pointer', border:'none',
                        background: form.emoji === e ? '#EFF6FF' : 'transparent',
                        outline: form.emoji === e ? '2px solid #2563EB' : 'none'
                      }}>{e}</button>
                    ))}
                  </div>
                </div>
                <input placeholder="Goal name (e.g. New iPhone, Goa trip)" required
                  value={form.title} onChange={e => setForm({...form, title:e.target.value})}
                  style={inputStyle} />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                  <input type="number" placeholder="Target amount (₹)" required
                    value={form.target_amount} onChange={e => setForm({...form, target_amount:e.target.value})}
                    style={inputStyle} />
                  <input type="date" value={form.deadline}
                    onChange={e => setForm({...form, deadline:e.target.value})}
                    style={inputStyle} />
                </div>
                <button type="submit" disabled={loading} style={{
                  background:'#2563EB', color:'white', border:'none', borderRadius:'8px',
                  padding:'11px', cursor:'pointer', fontWeight:600, fontSize:'14px'
                }}>
                  {loading ? 'Creating...' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Goals list */}
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          {goals.length === 0 ? (
            <div style={{ textAlign:'center', background:card, borderRadius:'12px', padding:'48px', color:sub, border:`1px solid ${border}` }}>
              <p style={{ fontSize:'32px', margin:'0 0 8px' }}>🎯</p>
              <p style={{ fontWeight:500, margin:'0 0 4px', color:text }}>No goals yet</p>
              <p style={{ fontSize:'13px', margin:0 }}>Create your first savings goal above</p>
            </div>
          ) : goals.map(g => (
            <div key={g.id} style={{
              background: g.is_completed ? (darkMode ? '#052E16' : '#F0FDF4') : card,
              borderRadius:'12px', padding:'20px',
              border:`1px solid ${g.is_completed ? '#86EFAC' : border}`
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <span style={{ fontSize:'28px' }}>{g.emoji}</span>
                  <div>
                    <p style={{ fontWeight:600, fontSize:'15px', margin:'0 0 2px', color:text }}>{g.title}</p>
                    <p style={{ fontSize:'12px', color:sub, margin:0 }}>
                      {g.deadline ? `Target: ${g.deadline}` : 'No deadline set'}
                    </p>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  {g.is_completed && (
                    <span style={{ fontSize:'12px', background:'#DCFCE7', color:'#16A34A', padding:'4px 10px', borderRadius:'20px', fontWeight:600 }}>
                      Completed 🎉
                    </span>
                  )}
                  <button onClick={() => handleDelete(g.id)} style={{
                    background:'none', border:'none', color:darkMode ? '#4B5563' : '#D1D5DB',
                    cursor:'pointer', fontSize:'16px'
                  }}
                    onMouseEnter={e => e.target.style.color='#EF4444'}
                    onMouseLeave={e => e.target.style.color=darkMode?'#4B5563':'#D1D5DB'}
                  >✕</button>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom:'10px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                  <span style={{ fontSize:'13px', color:sub }}>
                    ₹{g.saved_amount.toLocaleString()} saved
                  </span>
                  <span style={{ fontSize:'13px', fontWeight:600, color:g.is_completed ? '#16A34A' : text }}>
                    {g.percent}% of ₹{g.target_amount.toLocaleString()}
                  </span>
                </div>
                <div style={{ background:darkMode ? '#374151' : '#F3F4F6', borderRadius:'8px', height:'10px' }}>
                  <div style={{
                    width:`${g.percent}%`, height:'100%', borderRadius:'8px',
                    background: g.is_completed ? '#10B981' : g.percent > 75 ? '#F59E0B' : '#3B82F6',
                    transition:'width 0.6s ease'
                  }} />
                </div>
                <p style={{ fontSize:'12px', color:sub, margin:'4px 0 0' }}>
                  ₹{g.remaining.toLocaleString()} more to go
                </p>
              </div>

              {/* Deposit */}
              {!g.is_completed && (
                <div style={{ display:'flex', gap:'8px', marginTop:'8px' }}>
                  <input
                    type="number" placeholder="Add amount (₹)"
                    value={deposit[g.id] || ''}
                    onChange={e => setDeposit(prev => ({...prev, [g.id]: e.target.value}))}
                    style={{ ...inputStyle, flex:1 }}
                  />
                  <button onClick={() => handleDeposit(g.id)} style={{
                    background:'#10B981', color:'white', border:'none', borderRadius:'8px',
                    padding:'9px 16px', cursor:'pointer', fontWeight:600, fontSize:'13px', whiteSpace:'nowrap'
                  }}>
                    + Add
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}