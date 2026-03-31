import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Transactions() {
  const { darkMode } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [form, setForm] = useState({
    category_id: '', amount: '', type: 'expense', description: '', date: ''
  });
  const [loading, setLoading] = useState(false);
  const now = new Date();

  const bg     = darkMode ? '#111827' : '#F9FAFB';
  const card   = darkMode ? '#1F2937' : '#FFFFFF';
  const text   = darkMode ? '#F9FAFB' : '#111827';
  const sub    = darkMode ? '#9CA3AF' : '#6B7280';
  const border = darkMode ? '#374151' : '#E5E7EB';
  const inputBg = darkMode ? '#374151' : '#FFFFFF';

  const inputStyle = {
    border: `1px solid ${border}`, borderRadius: '8px',
    padding: '8px 12px', fontSize: '13px', outline: 'none',
    background: inputBg, color: text, width: '100%', boxSizing: 'border-box'
  };

  const fetchTransactions = () => {
    API.get(`/transactions/?month=${now.getMonth()+1}&year=${now.getFullYear()}`)
      .then(res => setTransactions(res.data));
  };

  useEffect(() => {
    fetchTransactions();
    API.get('/categories/').then(res => setCategories(res.data)).catch(() => {});
  }, []);

  const suggestCategory = async (desc) => {
    if (desc.length < 3) return;
    try {
      const res = await API.get(`/transactions/suggest-category?description=${desc}`);
      if (res.data.category_id) {
        setForm(prev => ({ ...prev, category_id: res.data.category_id.toString() }));
      }
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/transactions/', {
        ...form,
        amount:      parseFloat(form.amount),
        category_id: form.category_id ? parseInt(form.category_id) : null
      });
      setForm({ category_id:'', amount:'', type:'expense', description:'', date:'' });
      fetchTransactions();
    } catch {
      alert('Error adding transaction');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    await API.delete(`/transactions/${id}`);
    fetchTransactions();
  };

  const getCategoryName = (t) => {
    if (t.category_id) {
      const cat = categories.find(c => c.id === t.category_id);
      return cat ? cat.name : 'Other';
    }
    return 'Other';
  };

  const getCategoryColor = (catName) => {
    const colorMap = {
      'Mess / Food': '#3B82F6', 'Canteen / Snacks': '#F59E0B',
      'Transport': '#10B981', 'Stationery': '#EF4444',
      'Entertainment': '#8B5CF6', 'Medical': '#EC4899',
      'Clothing': '#06B6D4', 'Recharge': '#84CC16', 'Other': '#6B7280'
    };
    return colorMap[catName] || '#6B7280';
  };

  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text }}>
      <Navbar />
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: 'clamp(16px, 4vw, 24px)' }}>

        <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 20px', color: text }}>Transactions</h2>

        {/* Summary row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: darkMode ? '#052E16' : '#F0FDF4', borderRadius: '10px', padding: '14px 16px', border: '1px solid #86EFAC' }}>
            <p style={{ fontSize: '12px', color: '#16A34A', margin: '0 0 4px' }}>Total income this month</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#16A34A', margin: 0 }}>+₹{totalIncome.toLocaleString()}</p>
          </div>
          <div style={{ background: darkMode ? '#450A0A' : '#FEF2F2', borderRadius: '10px', padding: '14px 16px', border: '1px solid #FECACA' }}>
            <p style={{ fontSize: '12px', color: '#EF4444', margin: '0 0 4px' }}>Total expenses this month</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#EF4444', margin: 0 }}>-₹{totalExpense.toLocaleString()}</p>
          </div>
        </div>

        {/* Add transaction form */}
        <div style={{ background: card, borderRadius: '12px', padding: '20px', border: `1px solid ${border}`, marginBottom: '20px' }}>
          <h3 style={{ fontWeight: 600, fontSize: '15px', margin: '0 0 14px', color: text }}>Add transaction</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} style={inputStyle}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <input
                type="number" placeholder="Amount (₹)" required value={form.amount}
                onChange={e => setForm({...form, amount: e.target.value})}
                style={inputStyle}
              />
              <select
                value={form.category_id}
                onChange={e => setForm({...form, category_id: e.target.value})}
                style={inputStyle}
              >
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: '10px' }}>
              <input
                placeholder="Description (auto-suggests category)"
                value={form.description}
                onChange={e => {
                  setForm({...form, description: e.target.value});
                  suggestCategory(e.target.value);
                }}
                style={inputStyle}
              />
              <input
                type="date" required value={form.date}
                onChange={e => setForm({...form, date: e.target.value})}
                style={inputStyle}
              />
              <button type="submit" disabled={loading} style={{
                background: '#2563EB', color: 'white', border: 'none',
                borderRadius: '8px', padding: '8px', cursor: 'pointer',
                fontWeight: 600, fontSize: '13px', opacity: loading ? 0.6 : 1
              }}>
                {loading ? 'Adding...' : '+ Add'}
              </button>
            </div>
            <p style={{ fontSize: '11px', color: sub, margin: '6px 0 0' }}>
              Tip: Type a description and the category will be auto-suggested
            </p>
          </form>
        </div>

        {/* Transaction list */}
        <div style={{ background: card, borderRadius: '12px', border: `1px solid ${border}`, overflow: 'hidden' }}>
          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: sub }}>
              No transactions this month
            </div>
          ) : (
            transactions.map((t, i) => {
              const catName = getCategoryName(t);
              const catColor = getCategoryColor(catName);
              return (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderBottom: i < transactions.length - 1 ? `1px solid ${border}` : 'none',
                  transition: 'background 0.15s'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = darkMode ? '#374151' : '#F9FAFB'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: catColor + '20', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: catColor }} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 500, fontSize: '14px', margin: '0 0 2px', color: text }}>
                        {t.description || 'No description'}
                      </p>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: sub }}>{t.date}</span>
                        <span style={{
                          fontSize: '11px', padding: '1px 8px', borderRadius: '20px',
                          background: catColor + '20', color: catColor, fontWeight: 500
                        }}>
                          {catName}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      fontWeight: 600, fontSize: '14px',
                      color: t.type === 'income' ? '#10B981' : '#EF4444'
                    }}>
                      {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleDelete(t.id)}
                      style={{
                        background: 'none', border: 'none', color: darkMode ? '#4B5563' : '#D1D5DB',
                        cursor: 'pointer', fontSize: '16px', padding: '2px 6px',
                        borderRadius: '4px', transition: 'color 0.15s'
                      }}
                      onMouseEnter={e => e.target.style.color = '#EF4444'}
                      onMouseLeave={e => e.target.style.color = darkMode ? '#4B5563' : '#D1D5DB'}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}