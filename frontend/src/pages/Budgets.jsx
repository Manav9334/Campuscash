import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Budgets() {
  const { darkMode } = useAuth();
  const [status,     setStatus]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ category_id: '', limit_amount: '' });
  const now = new Date();

  const bg     = darkMode ? '#111827' : '#F9FAFB';
  const card   = darkMode ? '#1F2937' : '#FFFFFF';
  const text   = darkMode ? '#F9FAFB' : '#111827';
  const sub    = darkMode ? '#9CA3AF' : '#6B7280';
  const border = darkMode ? '#374151' : '#E5E7EB';
  const inputBg = darkMode ? '#374151' : '#FFFFFF';

  const inputStyle = {
    border: `1px solid ${border}`, borderRadius: '8px',
    padding: '9px 12px', fontSize: '13px', outline: 'none',
    background: inputBg, color: text, boxSizing: 'border-box'
  };

  const fetchAll = () => {
    API.get(`/budgets/status?month=${now.getMonth()+1}&year=${now.getFullYear()}`)
      .then(res => setStatus(res.data)).catch(() => setStatus([]));
  };

  useEffect(() => {
    fetchAll();
    API.get('/categories/').then(res => setCategories(res.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await API.post('/budgets/', {
      category_id:  parseInt(form.category_id),
      limit_amount: parseFloat(form.limit_amount),
      month:        now.getMonth() + 1,
      year:         now.getFullYear()
    });
    setForm({ category_id: '', limit_amount: '' });
    fetchAll();
  };

  const totalBudget = status.reduce((a, b) => a + b.limit, 0);
  const totalSpent  = status.reduce((a, b) => a + b.spent, 0);
  const overCount   = status.filter(b => b.is_over).length;

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text }}>
      <Navbar />
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: 'clamp(16px, 4vw, 24px)' }}>

        <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 20px', color: text }}>Budgets</h2>

        {/* Summary row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Total budgeted',  value: `₹${totalBudget.toLocaleString()}`, color: '#3B82F6' },
            { label: 'Total spent',     value: `₹${totalSpent.toLocaleString()}`,  color: '#EF4444' },
            { label: 'Over budget in',  value: `${overCount} categories`, color: overCount > 0 ? '#EF4444' : '#10B981' },
          ].map((s, i) => (
            <div key={i} style={{ background: card, borderRadius: '10px', padding: '14px', border: `1px solid ${border}` }}>
              <p style={{ fontSize: '12px', color: sub, margin: '0 0 4px' }}>{s.label}</p>
              <p style={{ fontSize: '18px', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Set budget form */}
        <div style={{ background: card, borderRadius: '12px', padding: '20px', border: `1px solid ${border}`, marginBottom: '20px' }}>
          <h3 style={{ fontWeight: 600, fontSize: '15px', margin: '0 0 14px', color: text }}>
            Set a budget limit
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
            <select
              value={form.category_id} required
              onChange={e => setForm({...form, category_id: e.target.value})}
              style={{ ...inputStyle, flex: 1 }}
            >
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input
              type="number" placeholder="Limit (₹)" required value={form.limit_amount}
              onChange={e => setForm({...form, limit_amount: e.target.value})}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button type="submit" style={{
              background: '#2563EB', color: 'white', border: 'none',
              borderRadius: '8px', padding: '9px 20px', cursor: 'pointer', fontWeight: 600, fontSize: '13px'
            }}>
              Set
            </button>
          </form>
        </div>

        {/* Budget status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {status.length === 0 ? (
            <div style={{ textAlign: 'center', background: card, borderRadius: '12px', padding: '48px', color: sub, border: `1px solid ${border}` }}>
              No budgets set for this month
            </div>
          ) : status.map((b, i) => {
            const pct    = Math.min(b.percent_used, 100);
            const barClr = b.is_over ? '#EF4444' : b.percent_used > 75 ? '#F59E0B' : '#10B981';
            return (
              <div key={i} style={{ background: card, borderRadius: '12px', padding: '18px 20px', border: `1px solid ${b.is_over ? '#FECACA' : border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '10px', height: '10px', borderRadius: '50%', background: barClr, flexShrink: 0
                    }} />
                    <span style={{ fontWeight: 600, fontSize: '14px', color: text }}>{b.category}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px', color: b.is_over ? '#EF4444' : text }}>
                      ₹{b.spent.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '13px', color: sub }}> / ₹{b.limit.toLocaleString()}</span>
                  </div>
                </div>
                <div style={{ background: darkMode ? '#374151' : '#F3F4F6', borderRadius: '6px', height: '8px', marginBottom: '8px' }}>
                  <div style={{
                    width: `${pct}%`, height: '100%', borderRadius: '6px',
                    background: barClr, transition: 'width 0.6s ease'
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: sub }}>{b.percent_used}% used</span>
                  <span style={{ fontSize: '12px', color: b.is_over ? '#EF4444' : '#10B981', fontWeight: 500 }}>
                    {b.is_over
                      ? `⚠️ Over by ₹${(b.spent - b.limit).toLocaleString()}`
                      : `₹${b.remaining.toLocaleString()} remaining`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}