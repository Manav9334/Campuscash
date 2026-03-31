import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import API from '../api/axios';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line
} from 'recharts';

const COLORS = ['#3B82F6','#F59E0B','#10B981','#EF4444','#8B5CF6','#EC4899','#06B6D4','#84CC16'];

export default function Dashboard() {
  const { user, darkMode } = useAuth();

  const [summary,      setSummary]      = useState(null);
  const [prediction,   setPrediction]   = useState(null);
  const [report,       setReport]       = useState(null);
  const [budgetStatus, setBudgetStatus] = useState([]);
  const [streak,       setStreak]       = useState(null);
  const [roast,        setRoast]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [roastLoading,  setRoastLoading]  = useState(false);
  const [streakMsg,    setStreakMsg]    = useState(null);

  // Chat state
  const [chatOpen,    setChatOpen]    = useState(false);
  const [chatMsgs,    setChatMsgs]    = useState([
    { role:'ai', text:"Hey! I'm your CampusCash AI. Ask me anything about your finances!" }
  ]);
  const [chatInput,   setChatInput]   = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  const now = new Date();

  const bg     = darkMode ? '#111827' : '#F9FAFB';
  const card   = darkMode ? '#1F2937' : '#FFFFFF';
  const text   = darkMode ? '#F9FAFB' : '#111827';
  const sub    = darkMode ? '#9CA3AF' : '#6B7280';
  const border = darkMode ? '#374151' : '#F3F4F6';
  const inputBg = darkMode ? '#374151' : '#FFFFFF';

  useEffect(() => {
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();
    Promise.all([
      API.get(`/transactions/summary?month=${month}&year=${year}`),
      API.get('/transactions/prediction'),
      API.get(`/budgets/status?month=${month}&year=${year}`),
      API.get('/gamification/streak')
    ]).then(([sumRes, predRes, budRes, strRes]) => {
      setSummary(sumRes.data);
      setPrediction(predRes.data);
      setBudgetStatus(budRes.data);
      setStreak(strRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [chatMsgs]);

  const sendChat = async (text) => {
    const msg = text || chatInput.trim();
    if (!msg) return;
    setChatMsgs(prev => [...prev, { role:'user', text:msg }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await API.post('/ai/chat', { message:msg });
      setChatMsgs(prev => [...prev, { role:'ai', text:res.data.reply }]);
    } catch {
      setChatMsgs(prev => [...prev, { role:'ai', text:'Sorry, try again!' }]);
    }
    setChatLoading(false);
  };

  const generateReport = async () => {
    setReportLoading(true);
    try {
      const res = await API.get('/ai/monthly-report');
      setReport(res.data.report);
    } catch { setReport('Could not generate report. Try again.'); }
    setReportLoading(false);
  };

  const logStreak = async () => {
    try {
      const res = await API.post('/gamification/streak/log');
      setStreak(prev => ({
        ...prev,
        current_streak: res.data.current_streak,
        longest_streak: res.data.longest_streak,
        logged_today: true
      }));
      if (res.data.is_milestone) {
        setStreakMsg(`🎉 ${res.data.current_streak} day streak milestone!`);
      } else {
        setStreakMsg(`🔥 Day ${res.data.current_streak} logged!`);
      }
      setTimeout(() => setStreakMsg(null), 3000);
    } catch {}
  };

  const getWeeklyRoast = async () => {
    setRoastLoading(true);
    try {
      const res = await API.get('/gamification/roast');
      setRoast(res.data.roast);
    } catch { setRoast("Our AI comedian is on a tea break ☕"); }
    setRoastLoading(false);
  };

  const pieData    = summary ? Object.entries(summary.by_category).map(([name,value]) => ({name,value})) : [];
  const weeklyData = prediction ? Object.entries(prediction.weekly_breakdown).map(([week,amount]) => ({week,amount})) : [];
  const overBudgetCount = budgetStatus.filter(b => b.is_over).length;

  return (
    <div style={{ minHeight:'100vh', background:bg, color:text, transition:'all 0.2s' }}>
      <Navbar />

      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'24px' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px' }}>
          <div>
            <h2 style={{ fontSize:'24px', fontWeight:700, margin:0, color:text }}>
              Hey {user?.name?.split(' ')[0]}! 👋
            </h2>
            <p style={{ color:sub, fontSize:'14px', marginTop:'4px', marginBottom:0 }}>
              {now.toLocaleString('default',{month:'long'})} {now.getFullYear()}
            </p>
          </div>
          <button
            onClick={generateReport} disabled={reportLoading}
            style={{
              background:'#7C3AED', color:'white', border:'none', borderRadius:'10px',
              padding:'10px 18px', cursor:'pointer', fontSize:'13px', fontWeight:600,
              opacity: reportLoading ? 0.7 : 1
            }}
          >
            {reportLoading ? 'Generating...' : 'Monthly Report'}
          </button>
        </div>

        {/* Budget alert banner */}
        {overBudgetCount > 0 && (
          <div style={{
            background: darkMode ? '#450A0A' : '#FEF2F2',
            border:'1px solid #FECACA', borderRadius:'10px',
            padding:'12px 16px', marginBottom:'16px',
            display:'flex', alignItems:'center', gap:'10px'
          }}>
            <span style={{ fontSize:'18px' }}>🚨</span>
            <span style={{ color:'#DC2626', fontSize:'14px', fontWeight:500 }}>
              Over budget in <strong>{overBudgetCount}</strong> {overBudgetCount===1?'category':'categories'}!{' '}
              <Link to="/budgets" style={{ color:'#DC2626', textDecoration:'underline' }}>View →</Link>
            </span>
          </div>
        )}

        {/* AI Monthly Report */}
        {report && (
          <div style={{
            background: darkMode ? '#1E1B4B' : '#EEF2FF',
            border:'1px solid #C7D2FE', borderRadius:'12px',
            padding:'16px', marginBottom:'20px'
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
              <span style={{ fontWeight:600, color:'#4F46E5', fontSize:'14px' }}>📊 AI Monthly Report</span>
              <button onClick={() => setReport(null)} style={{
                background:'none', border:'none', cursor:'pointer', color:sub, fontSize:'18px'
              }}>×</button>
            </div>
            <p style={{ fontSize:'13px', lineHeight:'1.7', color: darkMode ? '#C7D2FE' : '#3730A3', margin:0 }}>
              {report}
            </p>
          </div>
        )}

        {/* KPI Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'20px' }}>

          <div className="grid-4" style={{
  display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
  gap: '12px', marginBottom: '20px'
}}></div>
          {[
            { label:'Monthly allowance', value:`₹${(user?.monthly_allowance||0).toLocaleString()}`,                                              color:'#3B82F6' },
            { label:'Spent this month',  value:`₹${(summary?.total_expense||0).toLocaleString()}`,                                               color:'#EF4444' },
            { label:'Remaining',         value:`₹${((user?.monthly_allowance||0)-(summary?.total_expense||0)).toLocaleString()}`,                color:'#10B981' },
            { label:'Safe daily limit',  value:`₹${prediction?.safe_daily_limit||0}/day`,                                                        color:'#8B5CF6' },
          ].map((c,i) => (
            <div key={i} style={{
              background:card, borderRadius:'12px', padding:'16px',
              border:`1px solid ${border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <p style={{ fontSize:'12px', color:sub, margin:'0 0 6px' }}>{c.label}</p>
              <p style={{ fontSize:'22px', fontWeight:700, color:c.color, margin:0 }}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Spending prediction */}
        {prediction && (
          <div style={{
            background: prediction.over_budget
              ? (darkMode?'#450A0A':'#FEF2F2')
              : (darkMode?'#052E16':'#F0FDF4'),
            border:`1px solid ${prediction.over_budget?'#FECACA':'#BBF7D0'}`,
            borderRadius:'12px', padding:'16px', marginBottom:'20px'
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <p style={{
                  fontWeight:600, fontSize:'14px', margin:'0 0 4px',
                  color: prediction.over_budget ? '#DC2626' : '#16A34A'
                }}>
                  {prediction.over_budget ? '⚠️ Overspend predicted' : '✅ On track this month'}
                </p>
                <p style={{ fontSize:'13px', color:sub, margin:0 }}>
                  At your current pace (₹{prediction.daily_average}/day), you'll spend{' '}
                  <strong style={{ color: prediction.over_budget ? '#DC2626' : '#16A34A' }}>
                    ₹{prediction.predicted_total?.toLocaleString()}
                  </strong>{' '}
                  by month end
                  {prediction.over_budget && ` — ₹${prediction.overspend_by} over budget!`}
                </p>
              </div>
              <div style={{ textAlign:'right' }}>
                <p style={{ fontSize:'11px', color:sub, margin:'0 0 2px' }}>Days left</p>
                <p style={{ fontSize:'22px', fontWeight:700, color:text, margin:0 }}>{prediction.days_left}</p>
              </div>
            </div>
          </div>
        )}

        {/* Streak + Roast row */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'20px' }}>
          <div className="grid-2" style={{
  display: 'grid', gridTemplateColumns: '1fr 1fr',
  gap: '16px', marginBottom: '20px'
}}></div>

          {/* Streak */}
          <div style={{ background:card, borderRadius:'12px', padding:'20px', border:`1px solid ${border}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <p style={{ fontSize:'13px', color:sub, margin:'0 0 4px' }}>Daily streak</p>
                <div style={{ display:'flex', alignItems:'baseline', gap:'6px' }}>
                  <span style={{ fontSize:'36px', fontWeight:700, color: streak?.current_streak > 0 ? '#F59E0B' : sub }}>
                    {streak?.current_streak || 0}
                  </span>
                  <span style={{ fontSize:'14px', color:sub }}>days</span>
                </div>
                <p style={{ fontSize:'12px', color:sub, margin:'4px 0 0' }}>
                  Best: {streak?.longest_streak || 0} days · Total: {streak?.total_days || 0} days logged
                </p>
              </div>
              <span style={{ fontSize:'38px' }}>
                {streak?.current_streak >= 30 ? '🏆' :
                 streak?.current_streak >= 14 ? '💎' :
                 streak?.current_streak >= 7  ? '🥇' :
                 streak?.current_streak >= 3  ? '🥈' : '🔥'}
              </span>
            </div>

            {streakMsg && (
              <div style={{
                background:'#FEF3C7', border:'1px solid #FDE68A', borderRadius:'8px',
                padding:'8px 12px', marginTop:'10px', fontSize:'12px', color:'#92400E', fontWeight:500
              }}>
                {streakMsg}
              </div>
            )}

            {streak?.streak_at_risk && !streak?.logged_today && (
              <div style={{
                background: darkMode?'#450A0A':'#FEF2F2', border:'1px solid #FECACA',
                borderRadius:'8px', padding:'8px 12px', marginTop:'8px',
                fontSize:'12px', color:'#DC2626', fontWeight:500
              }}>
                ⚠️ Log today to keep your streak alive!
              </div>
            )}

            <button
              onClick={logStreak} disabled={streak?.logged_today}
              style={{
                marginTop:'12px', width:'100%', padding:'9px',
                background: streak?.logged_today ? (darkMode?'#374151':'#F3F4F6') : '#F59E0B',
                color: streak?.logged_today ? sub : 'white',
                border:'none', borderRadius:'8px',
                cursor: streak?.logged_today ? 'default' : 'pointer',
                fontWeight:600, fontSize:'13px', transition:'all 0.2s'
              }}
            >
              {streak?.logged_today ? '✅ Logged today!' : '🔥 Log today\'s activity'}
            </button>
          </div>

          {/* Roast */}
          <div style={{ background:card, borderRadius:'12px', padding:'20px', border:`1px solid ${border}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
              <div>
                <p style={{ fontSize:'13px', color:sub, margin:'0 0 2px' }}>Weekly roast 🎤</p>
                <p style={{ fontSize:'12px', color:sub, margin:0 }}>AI judges your spending habits</p>
              </div>
              <span style={{ fontSize:'30px' }}>😂</span>
            </div>

            {roast ? (
              <div>
                <p style={{
                  fontSize:'13px', lineHeight:'1.6', color:text, margin:'0 0 12px',
                  fontStyle:'italic', background: darkMode?'#374151':'#FFF7ED',
                  padding:'12px', borderRadius:'8px',
                  border:`1px solid ${darkMode?'#4B5563':'#FED7AA'}`
                }}>
                  "{roast}"
                </p>
                <button onClick={() => setRoast(null)} style={{
                  background:'none', border:`1px solid ${border}`, borderRadius:'8px',
                  padding:'6px 12px', cursor:'pointer', fontSize:'12px', color:sub
                }}>
                  Get new roast
                </button>
              </div>
            ) : (
              <button
                onClick={getWeeklyRoast} disabled={roastLoading}
                style={{
                  width:'100%', padding:'12px',
                  background: darkMode?'#374151':'#FFF7ED',
                  color: darkMode?'#FCD34D':'#92400E',
                  border:`1px solid ${darkMode?'#4B5563':'#FED7AA'}`,
                  borderRadius:'8px', cursor:'pointer', fontWeight:600, fontSize:'13px'
                }}
              >
                {roastLoading ? 'Roasting you... 🔥' : '🎤 Roast my spending!'}
              </button>
            )}
          </div>
        </div>

        {/* Charts */}
        {loading ? (
          <div style={{ textAlign:'center', color:sub, padding:'60px' }}>Loading your data...</div>
          
        ) : pieData.length === 0 ? (
          <div style={{
            textAlign:'center', background:card, borderRadius:'12px',
            padding:'60px', border:`1px solid ${border}`
          }}>
            
            <p style={{ color:sub, fontSize:'16px', margin:'0 0 8px' }}>No transactions yet this month</p>
            <p style={{ color: darkMode?'#4B5563':'#D1D5DB', fontSize:'13px', margin:0 }}>
              Add your first expense to see insights
            </p>
          </div>
        ) : (
          <>
            {/* Pie + Bar */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
              <div style={{ background:card, borderRadius:'12px', padding:'20px', border:`1px solid ${border}` }}>
                <h3 style={{ fontWeight:600, fontSize:'14px', margin:'0 0 16px', color:text }}>
                  Spending by category
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name"
                      cx="50%" cy="50%" outerRadius={85}
                      label={({name,percent}) => `${name} ${(percent*100).toFixed(0)}%`}
                      labelLine={true}>
                      {pieData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => `₹${v.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background:card, borderRadius:'12px', padding:'20px', border:`1px solid ${border}` }}>
                <h3 style={{ fontWeight:600, fontSize:'14px', margin:'0 0 16px', color:text }}>
                  Category breakdown
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={pieData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode?'#374151':'#F3F4F6'} />
                    <XAxis type="number" tickFormatter={v=>`₹${v}`} tick={{fontSize:11,fill:sub}} />
                    <YAxis type="category" dataKey="name" width={110} tick={{fontSize:11,fill:sub}} />
                    <Tooltip formatter={v=>`₹${v.toLocaleString()}`} />
                    <Bar dataKey="value" fill="#3B82F6" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekly trend */}
            {weeklyData.length > 0 && (
              <div style={{ background:card, borderRadius:'12px', padding:'20px', border:`1px solid ${border}`, marginBottom:'16px' }}>
                <h3 style={{ fontWeight:600, fontSize:'14px', margin:'0 0 16px', color:text }}>
                  Weekly spending trend
                </h3>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode?'#374151':'#F3F4F6'} />
                    <XAxis dataKey="week" tick={{fontSize:12,fill:sub}} />
                    <YAxis tickFormatter={v=>`₹${v}`} tick={{fontSize:12,fill:sub}} />
                    <Tooltip formatter={v=>`₹${v.toLocaleString()}`} />
                    <Line type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={2.5}
                      dot={{fill:'#3B82F6',r:4}} activeDot={{r:6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Budget status */}
            {budgetStatus.length > 0 && (
              <div style={{ background:card, borderRadius:'12px', padding:'20px', border:`1px solid ${border}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
                  <h3 style={{ fontWeight:600, fontSize:'14px', margin:0, color:text }}>Budget status</h3>
                  <Link to="/budgets" style={{ fontSize:'12px', color:'#3B82F6', textDecoration:'none' }}>
                    Manage →
                  </Link>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  {budgetStatus.map((b,i) => (
                    <div key={i}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                        <span style={{ fontSize:'13px', color:text }}>{b.category}</span>
                        <span style={{
                          fontSize:'13px', fontWeight:600,
                          color: b.is_over?'#EF4444': b.percent_used>75?'#F59E0B':'#10B981'
                        }}>
                          ₹{b.spent} / ₹{b.limit} {b.is_over&&'⚠️'}
                        </span>
                      </div>
                      <div style={{ background:darkMode?'#374151':'#F3F4F6', borderRadius:'4px', height:'6px' }}>
                        <div style={{
                          width:`${Math.min(b.percent_used,100)}%`, height:'100%', borderRadius:'4px',
                          background: b.is_over?'#EF4444': b.percent_used>75?'#F59E0B':'#10B981',
                          transition:'width 0.5s'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating AI Chat */}
      <div style={{
  position: 'fixed',
  bottom: 'env(safe-area-inset-bottom, 24px)',
  right: '16px',
  zIndex: 1000
}}>
        {chatOpen && (
          <div style={{
            position:'absolute', bottom:'70px', right:'0', width:'340px',
            background: darkMode?'#1F2937':'white', borderRadius:'16px',
            boxShadow:'0 8px 32px rgba(0,0,0,0.2)',
            border:`1px solid ${darkMode?'#374151':'#E5E7EB'}`, overflow:'hidden'
          }}>
            {/* Chat header */}
            <div style={{
              background:'#2563EB', color:'white', padding:'12px 16px',
              display:'flex', justifyContent:'space-between', alignItems:'center'
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ fontSize:'18px' }}>🤖</span>
                <div>
                  <p style={{ fontWeight:600, fontSize:'13px', margin:0 }}>CampusCash AI</p>
                  <p style={{ fontSize:'11px', opacity:0.8, margin:0 }}>Your finance assistant</p>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} style={{
                background:'none', border:'none', color:'white', cursor:'pointer', fontSize:'20px'
              }}>×</button>
            </div>

            {/* Messages */}
            <div style={{
              height:'260px', overflowY:'auto', padding:'12px',
              display:'flex', flexDirection:'column', gap:'8px'
            }}>
              {chatMsgs.map((msg,i) => (
                <div key={i} style={{ display:'flex', justifyContent: msg.role==='user'?'flex-end':'flex-start' }}>
                  <div style={{
                    maxWidth:'82%', padding:'8px 12px', borderRadius:'12px',
                    fontSize:'13px', lineHeight:'1.5',
                    background: msg.role==='user' ? '#2563EB' : (darkMode?'#374151':'#F3F4F6'),
                    color: msg.role==='user' ? 'white' : text,
                    borderBottomRightRadius: msg.role==='user' ? '4px' : '12px',
                    borderBottomLeftRadius:  msg.role==='ai'   ? '4px' : '12px',
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display:'flex', justifyContent:'flex-start' }}>
                  <div style={{
                    background: darkMode?'#374151':'#F3F4F6',
                    padding:'8px 12px', borderRadius:'12px',
                    borderBottomLeftRadius:'4px', fontSize:'13px', color:sub
                  }}>
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick suggestions */}
            <div style={{
              padding:'6px 12px 8px', display:'flex', gap:'6px', flexWrap:'wrap',
              borderTop:`1px solid ${darkMode?'#374151':'#F9FAFB'}`
            }}>
              {['How much spent?','Save tips','Daily budget?','Can I afford ₹500?'].map(s => (
                <button key={s} onClick={() => sendChat(s)} style={{
                  fontSize:'11px', padding:'3px 8px', borderRadius:'20px',
                  background: darkMode?'#374151':'#EFF6FF', color:'#2563EB',
                  border:`1px solid ${darkMode?'#4B5563':'#BFDBFE'}`, cursor:'pointer'
                }}>
                  {s}
                </button>
              ))}
            </div>

            {/* Input */}
            <div style={{
              padding:'8px 12px 12px', display:'flex', gap:'8px',
              borderTop:`1px solid ${darkMode?'#374151':'#F3F4F6'}`
            }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key==='Enter' && sendChat()}
                placeholder="Ask anything..."
                style={{
                  flex:1, border:`1px solid ${darkMode?'#4B5563':'#E5E7EB'}`,
                  borderRadius:'8px', padding:'8px 12px', fontSize:'13px',
                  outline:'none', background:inputBg, color:text
                }}
              />
              <button
                onClick={() => sendChat()}
                disabled={chatLoading || !chatInput.trim()}
                style={{
                  background:'#2563EB', color:'white', border:'none',
                  borderRadius:'8px', padding:'8px 14px', cursor:'pointer',
                  fontSize:'13px', fontWeight:600, opacity: chatLoading?0.5:1
                }}
              >
                Send
              </button>
            </div>
          </div>
        )}

        {/* Chat toggle button */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          style={{
            width:'56px', height:'56px', borderRadius:'50%',
            background:'#2563EB', color:'white', border:'none', cursor:'pointer',
            fontSize:'22px', boxShadow:'0 4px 16px rgba(37,99,235,0.5)',
            display:'flex', alignItems:'center', justifyContent:'center',
            transition:'transform 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform='scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
        >
          {chatOpen ? '×' : '💬'}
        </button>
      </div>
    </div>
  );
}