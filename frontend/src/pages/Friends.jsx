import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Friends() {
  const { darkMode, user } = useAuth();
  const [friends,    setFriends]    = useState([]);
  const [requests,   setRequests]   = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [settleUp,   setSettleUp]   = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchError,  setSearchError]  = useState('');
  const [activeTab,  setActiveTab]  = useState('friends');
  const [loading,    setLoading]    = useState(false);
  const [sendLoading, setSendLoading] = useState(false);

  const bg      = darkMode ? '#111827' : '#F9FAFB';
  const card    = darkMode ? '#1F2937' : '#FFFFFF';
  const text    = darkMode ? '#F9FAFB' : '#111827';
  const sub     = darkMode ? '#9CA3AF' : '#6B7280';
  const border  = darkMode ? '#374151' : '#E5E7EB';
  const inputBg = darkMode ? '#374151' : '#FFFFFF';

  const inputStyle = {
    border: `1px solid ${border}`, borderRadius: '8px',
    padding: '9px 12px', fontSize: '13px', outline: 'none',
    background: inputBg, color: text, boxSizing: 'border-box'
  };

  const fetchAll = () => {
    API.get('/friends/list').then(res => setFriends(res.data)).catch(() => {});
    API.get('/friends/requests').then(res => setRequests(res.data)).catch(() => {});
    API.get('/friends/leaderboard').then(res => setLeaderboard(res.data)).catch(() => {});
    API.get('/friends/settle-up').then(res => setSettleUp(res.data)).catch(() => {});
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchResult(null);
    setSearchError('');
    setLoading(true);
    try {
      const res = await API.get(`/friends/search?email=${searchEmail}`);
      setSearchResult(res.data);
    } catch (err) {
      setSearchError(err.response?.data?.detail || 'User not found');
    }
    setLoading(false);
  };

  const sendRequest = async (email) => {
    setSendLoading(true);
    try {
      await API.post('/friends/request', { email });
      setSearchResult(null);
      setSearchEmail('');
      alert('Friend request sent!');
    } catch (err) {
      alert(err.response?.data?.detail || 'Error sending request');
    }
    setSendLoading(false);
  };

  const respondRequest = async (friendshipId, action) => {
    await API.put(`/friends/request/${friendshipId}?action=${action}`);
    fetchAll();
  };

  const removeFriend = async (friendshipId) => {
    if (!window.confirm('Remove this friend?')) return;
    await API.delete(`/friends/${friendshipId}`);
    fetchAll();
  };

  const getRankEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const tabs = [
    { id: 'friends',     label: `Friends (${friends.length})` },
    { id: 'requests',    label: `Requests ${requests.length > 0 ? `(${requests.length})` : ''}` },
    { id: 'leaderboard', label: '🏆 Leaderboard' },
    { id: 'settle',      label: '💸 Settle Up' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text }}>
      <Navbar />
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: 'clamp(16px, 4vw, 24px)' }}>

        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 4px', color: text }}>Friends</h2>
          <p style={{ color: sub, fontSize: '14px', margin: 0 }}>
            Connect with roommates and classmates
          </p>
        </div>

        {/* Search */}
        <div style={{
          background: card, borderRadius: '12px', padding: '20px',
          border: `1px solid ${border}`, marginBottom: '20px'
        }}>
          <h3 style={{ fontWeight: 600, fontSize: '15px', margin: '0 0 12px', color: text }}>
            Add a friend
          </h3>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="email" placeholder="Search by email address" required
              value={searchEmail} onChange={e => setSearchEmail(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button type="submit" disabled={loading} style={{
              background: '#2563EB', color: 'white', border: 'none',
              borderRadius: '8px', padding: '9px 18px', cursor: 'pointer',
              fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap'
            }}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {searchError && (
            <p style={{ color: '#EF4444', fontSize: '13px', margin: '10px 0 0' }}>{searchError}</p>
          )}

          {searchResult && (
            <div style={{
              marginTop: '12px', padding: '14px', borderRadius: '10px',
              background: darkMode ? '#374151' : '#F9FAFB',
              border: `1px solid ${border}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: '#2563EB', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: '16px'
                }}>
                  {searchResult.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '14px', margin: 0, color: text }}>
                    {searchResult.name}
                  </p>
                  <p style={{ fontSize: '12px', color: sub, margin: 0 }}>
                    {searchResult.college || searchResult.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => sendRequest(searchResult.email)}
                disabled={sendLoading}
                style={{
                  background: '#10B981', color: 'white', border: 'none',
                  borderRadius: '8px', padding: '8px 16px', cursor: 'pointer',
                  fontWeight: 600, fontSize: '13px'
                }}
              >
                {sendLoading ? 'Sending...' : '+ Add Friend'}
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: darkMode ? '#374151' : '#F3F4F6', borderRadius: '10px', padding: '4px' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontSize: '13px', fontWeight: 500,
              background: activeTab === tab.id ? (darkMode ? '#1F2937' : 'white') : 'transparent',
              color: activeTab === tab.id ? text : sub,
              boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s'
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Friends tab */}
        {activeTab === 'friends' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {friends.length === 0 ? (
              <div style={{ textAlign: 'center', background: card, borderRadius: '12px', padding: '48px', color: sub, border: `1px solid ${border}` }}>
                <p style={{ fontSize: '32px', margin: '0 0 8px' }}>👥</p>
                <p style={{ fontWeight: 500, margin: '0 0 4px', color: text }}>No friends yet</p>
                <p style={{ fontSize: '13px', margin: 0 }}>Search by email to add friends</p>
              </div>
            ) : friends.map(f => (
              <div key={f.id} style={{
                background: card, borderRadius: '12px', padding: '16px 20px',
                border: `1px solid ${border}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: '#2563EB', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: '18px'
                  }}>
                    {f.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 2px', color: text }}>{f.name}</p>
                    <p style={{ fontSize: '12px', color: sub, margin: 0 }}>{f.college || f.email}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '18px', fontWeight: 700, color: '#F59E0B', margin: 0 }}>
                      {f.current_streak}🔥
                    </p>
                    <p style={{ fontSize: '11px', color: sub, margin: 0 }}>streak</p>
                  </div>
                  <button onClick={() => removeFriend(f.friendship_id)} style={{
                    background: 'none', border: `1px solid ${border}`,
                    borderRadius: '8px', padding: '6px 12px', cursor: 'pointer',
                    fontSize: '12px', color: sub
                  }}
                    onMouseEnter={e => { e.target.style.borderColor = '#EF4444'; e.target.style.color = '#EF4444'; }}
                    onMouseLeave={e => { e.target.style.borderColor = border; e.target.style.color = sub; }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Requests tab */}
        {activeTab === 'requests' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {requests.length === 0 ? (
              <div style={{ textAlign: 'center', background: card, borderRadius: '12px', padding: '48px', color: sub, border: `1px solid ${border}` }}>
                <p style={{ fontSize: '32px', margin: '0 0 8px' }}>📬</p>
                <p style={{ fontWeight: 500, color: text, margin: '0 0 4px' }}>No pending requests</p>
                <p style={{ fontSize: '13px', margin: 0 }}>Friend requests will appear here</p>
              </div>
            ) : requests.map(r => (
              <div key={r.friendship_id} style={{
                background: card, borderRadius: '12px', padding: '16px 20px',
                border: `1px solid #BFDBFE}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: '#7C3AED', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: '18px'
                  }}>
                    {r.sender_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 2px', color: text }}>
                      {r.sender_name}
                    </p>
                    <p style={{ fontSize: '12px', color: sub, margin: 0 }}>
                      {r.sender_college || r.sender_email}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => respondRequest(r.friendship_id, 'accepted')}
                    style={{
                      background: '#10B981', color: 'white', border: 'none',
                      borderRadius: '8px', padding: '8px 16px', cursor: 'pointer',
                      fontWeight: 600, fontSize: '13px'
                    }}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => respondRequest(r.friendship_id, 'rejected')}
                    style={{
                      background: darkMode ? '#374151' : '#F3F4F6', color: sub,
                      border: 'none', borderRadius: '8px', padding: '8px 16px',
                      cursor: 'pointer', fontSize: '13px'
                    }}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Leaderboard tab */}
        {activeTab === 'leaderboard' && (
          <div style={{ background: card, borderRadius: '12px', border: `1px solid ${border}`, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${border}` }}>
              <h3 style={{ fontWeight: 600, fontSize: '15px', margin: 0, color: text }}>
                🏆 Streak Leaderboard
              </h3>
              <p style={{ fontSize: '12px', color: sub, margin: '4px 0 0' }}>
                Who's logging expenses the most consistently
              </p>
            </div>
            {leaderboard.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: sub }}>
                Add friends to see the leaderboard
              </div>
            ) : leaderboard.map((entry, i) => (
              <div key={entry.user_id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: i < leaderboard.length - 1 ? `1px solid ${border}` : 'none',
                background: entry.is_you ? (darkMode ? '#1E3A5F' : '#EFF6FF') : 'transparent'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: entry.rank <= 3 ? '22px' : '14px', fontWeight: 700, minWidth: '28px', color: sub }}>
                    {getRankEmoji(entry.rank)}
                  </span>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: entry.is_you ? '#2563EB' : (darkMode ? '#374151' : '#E5E7EB'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '14px',
                    color: entry.is_you ? 'white' : text
                  }}>
                    {entry.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '14px', margin: 0, color: text }}>
                      {entry.name} {entry.is_you && <span style={{ fontSize: '11px', color: '#2563EB', fontWeight: 500 }}>(you)</span>}
                    </p>
                    <p style={{ fontSize: '12px', color: sub, margin: 0 }}>
                      Best: {entry.longest_streak} days · Total: {entry.total_days} days
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '20px', fontWeight: 700, color: '#F59E0B', margin: 0 }}>
                    {entry.current_streak}🔥
                  </p>
                  <p style={{ fontSize: '11px', color: sub, margin: 0 }}>current</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Settle up tab */}
        {activeTab === 'settle' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {settleUp.length === 0 ? (
              <div style={{ textAlign: 'center', background: card, borderRadius: '12px', padding: '48px', color: sub, border: `1px solid ${border}` }}>
                <p style={{ fontSize: '32px', margin: '0 0 8px' }}>💸</p>
                <p style={{ fontWeight: 500, color: text, margin: '0 0 4px' }}>All settled up!</p>
                <p style={{ fontSize: '13px', margin: 0 }}>Add friends and split expenses to track balances</p>
              </div>
            ) : settleUp.map((b, i) => (
              <div key={i} style={{
                background: card, borderRadius: '12px', padding: '18px 20px',
                border: `1px solid ${b.net_balance > 0 ? '#BBF7D0' : b.net_balance < 0 ? '#FECACA' : border}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: darkMode ? '#374151' : '#E5E7EB',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '16px', color: text
                    }}>
                      {b.friend_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 4px', color: text }}>
                        {b.friend_name}
                      </p>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <span style={{ fontSize: '12px', color: '#10B981' }}>
                          They owe you: ₹{b.they_owe_you}
                        </span>
                        <span style={{ fontSize: '12px', color: '#EF4444' }}>
                          You owe: ₹{b.you_owe_them}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{
                      fontSize: '18px', fontWeight: 700, margin: '0 0 2px',
                      color: b.net_balance > 0 ? '#10B981' : b.net_balance < 0 ? '#EF4444' : sub
                    }}>
                      {b.net_balance > 0 ? `+₹${b.net_balance}` :
                       b.net_balance < 0 ? `-₹${Math.abs(b.net_balance)}` : '✅ Settled'}
                    </p>
                    <p style={{ fontSize: '11px', color: sub, margin: 0 }}>
                      {b.net_balance > 0 ? 'they owe you' :
                       b.net_balance < 0 ? 'you owe them' : 'all clear'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}