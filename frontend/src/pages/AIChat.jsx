import { useState, useRef, useEffect } from 'react';
import Navbar from '../components/Navbar';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function AIChat() {
  const { darkMode } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: "Hey! I'm your CampusCash AI assistant. Ask me anything about your finances — how much you've spent, where you can save, or if you can afford something!"
    }
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const bg     = darkMode ? '#111827' : '#F9FAFB';
  const card   = darkMode ? '#1F2937' : '#FFFFFF';
  const text   = darkMode ? '#F9FAFB' : '#111827';
  const sub    = darkMode ? '#9CA3AF' : '#6B7280';
  const border = darkMode ? '#374151' : '#E5E7EB';
  const inputBg = darkMode ? '#374151' : '#FFFFFF';

  const suggestions = [
    "How much did I spend this month?",
    "Where am I overspending?",
    "How much can I spend per day?",
    "Can I afford a ₹500 outing?",
    "How can I save more money?",
    "What's my biggest expense?"
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg) return;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);
    try {
      const res = await API.post('/ai/chat', { message: userMsg });
      setMessages(prev => [...prev, { role: 'ai', text: res.data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I could not process that. Please try again!' }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text }}>
      <Navbar />
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px' }}>

        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 4px', color: text }}>
            AI Finance Assistant
          </h2>
          <p style={{ color: sub, fontSize: '14px', margin: 0 }}>
            Ask anything about your spending, savings or budget
          </p>
        </div>

        <div style={{
          background: card, borderRadius: '16px',
          border: `1px solid ${border}`, overflow: 'hidden'
        }}>

          {/* Chat header */}
          <div style={{
            background: '#2563EB', padding: '14px 20px',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px'
            }}>🤖</div>
            <div>
              <p style={{ color: 'white', fontWeight: 600, fontSize: '14px', margin: 0 }}>CampusCash AI</p>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: 0 }}>Always here to help</p>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            height: '420px', overflowY: 'auto', padding: '16px',
            display: 'flex', flexDirection: 'column', gap: '10px'
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.role === 'ai' && (
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: '#EFF6FF', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '14px', marginRight: '8px',
                    flexShrink: 0, alignSelf: 'flex-end'
                  }}>🤖</div>
                )}
                <div style={{
                  maxWidth: '75%', padding: '10px 14px', borderRadius: '14px',
                  fontSize: '14px', lineHeight: '1.5',
                  background: msg.role === 'user' ? '#2563EB' : (darkMode ? '#374151' : '#F3F4F6'),
                  color: msg.role === 'user' ? 'white' : text,
                  borderBottomRightRadius: msg.role === 'user' ? '4px' : '14px',
                  borderBottomLeftRadius:  msg.role === 'ai'   ? '4px' : '14px',
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: '#EFF6FF', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '14px'
                }}>🤖</div>
                <div style={{
                  background: darkMode ? '#374151' : '#F3F4F6',
                  padding: '10px 14px', borderRadius: '14px', borderBottomLeftRadius: '4px',
                  fontSize: '13px', color: sub
                }}>
                  Thinking...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggestions */}
          <div style={{
            padding: '10px 16px', borderTop: `1px solid ${border}`,
            display: 'flex', gap: '8px', flexWrap: 'wrap'
          }}>
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => sendMessage(s)} style={{
                fontSize: '12px', padding: '5px 12px', borderRadius: '20px',
                background: darkMode ? '#374151' : '#EFF6FF',
                color: '#2563EB', border: `1px solid ${darkMode ? '#4B5563' : '#BFDBFE'}`,
                cursor: 'pointer', whiteSpace: 'nowrap'
              }}>
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{
            padding: '12px 16px', borderTop: `1px solid ${border}`,
            display: 'flex', gap: '10px'
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask about your finances..."
              style={{
                flex: 1, border: `1px solid ${border}`, borderRadius: '10px',
                padding: '10px 14px', fontSize: '14px', outline: 'none',
                background: inputBg, color: text
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                background: '#2563EB', color: 'white', border: 'none',
                borderRadius: '10px', padding: '10px 20px', cursor: 'pointer',
                fontWeight: 600, fontSize: '14px', opacity: loading ? 0.5 : 1
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}