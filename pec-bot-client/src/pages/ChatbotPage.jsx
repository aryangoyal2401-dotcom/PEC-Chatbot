import React, { useEffect, useRef, useState } from 'react';
import { 
  Plus, Trash2, Send, Bot, User as UserIcon, 
  Menu, X, LogOut, Sparkles, MessageSquare, BookOpen, ExternalLink 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STARTERS = [
  'What is the minimum attendance requirement for exams?',
  'What is the fee payment procedure for 2026-27?',
  'What are the guidelines for Merit-cum-Means scholarships?',
  'How do I apply for on-campus hostel allotment?',
  'Where can I check previous year question papers (PYQs)?',
];

const STORAGE_PREFIX = 'pec_chatbot_sessions_';
let counter = 0;
const uid = () => `msg-${Date.now()}-${counter++}`;

export default function ChatbotPage() {
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  const storageKey = user?.email ? `${STORAGE_PREFIX}${user.email}` : `${STORAGE_PREFIX}guest`;

  // Load chat history from localStorage for authenticated user
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
          return;
        }
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }

    const firstSession = {
      id: `s-${Date.now()}`,
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      messages: [],
    };
    setSessions([firstSession]);
    setActiveSessionId(firstSession.id);
  }, [storageKey]);

  const saveSessions = (newSessions) => {
    setSessions(newSessions);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newSessions));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || { messages: [] };
  const currentMessages = activeSession?.messages || [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, busy]);

  const handleNewChat = () => {
    const fresh = {
      id: `s-${Date.now()}`,
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      messages: [],
    };
    const updated = [fresh, ...sessions];
    saveSessions(updated);
    setActiveSessionId(fresh.id);
  };

  const handleDeleteSession = (id, e) => {
    e.stopPropagation();
    const updated = sessions.filter((s) => s.id !== id);
    if (updated.length === 0) {
      const fresh = {
        id: `s-${Date.now()}`,
        title: 'New Conversation',
        createdAt: new Date().toISOString(),
        messages: [],
      };
      saveSessions([fresh]);
      setActiveSessionId(fresh.id);
    } else {
      saveSessions(updated);
      if (activeSessionId === id) {
        setActiveSessionId(updated[0].id);
      }
    }
  };

  const handleSendMessage = async (customQuery) => {
    const query = (customQuery ?? input).trim();
    if (!query || busy || !activeSessionId) return;

    setInput('');
    setBusy(true);

    const userMsg = { id: uid(), role: 'user', text: query };
    const historyPayload = currentMessages.slice(-8).map((m) => ({
      role: m.role,
      text: m.role === 'user' ? m.text : m.result?.answer || '',
    }));

    const sessionTitle =
      activeSession.messages.length === 0
        ? query.slice(0, 32) + (query.length > 32 ? '...' : '')
        : activeSession.title;

    const messagesWithUser = [...currentMessages, userMsg];

    let updatedSessions = sessions.map((s) =>
      s.id === activeSessionId
        ? { ...s, title: sessionTitle, messages: messagesWithUser }
        : s
    );
    saveSessions(updatedSessions);

    let result;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: query, history: historyPayload }),
      });

      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      result = await res.json();
    } catch {
      result = {
        status: 'error',
        answer: 'Unable to reach the PEC Assistant service. Please verify your connection.',
        sources: [],
      };
    }

    const botMsg = { id: uid(), role: 'assistant', result, question: query };
    const finalMessages = [...messagesWithUser, botMsg];

    updatedSessions = sessions.map((s) =>
      s.id === activeSessionId
        ? { ...s, title: sessionTitle, messages: finalMessages }
        : s
    );
    saveSessions(updatedSessions);
    setBusy(false);
  };

  return (
    <div className={`app-layout ${sidebarOpen ? '' : 'sidebar-closed'}`}>
      {/* ─── Sidebar with Chat History ─── */}
      <aside className="sidebar" aria-label="Main sidebar">
        <div className="sidebar-logo">
          <img src="/pec-logo.png" alt="PEC Logo" style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
          <div>
            <h1>PEC AI Assistant</h1>
            <span>Chatbot &amp; Support</span>
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* New Chat Button */}
        <div style={{ padding: '14px 12px 6px' }}>
          <button
            onClick={handleNewChat}
            className="btn btn-primary"
            style={{ width: '100%', gap: 8, fontSize: 13, justifyContent: 'center' }}
          >
            <Plus size={16} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Chat Sessions History */}
        <div className="sidebar-nav">
          <div className="nav-section-label">Chat History</div>
          {sessions.map((sess) => (
            <div
              key={sess.id}
              onClick={() => setActiveSessionId(sess.id)}
              className={`nav-link ${sess.id === activeSessionId ? 'active' : ''}`}
              style={{
                cursor: 'pointer',
                justifyContent: 'space-between',
                padding: '8px 10px',
                fontSize: 12.5,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                <MessageSquare size={14} style={{ flexShrink: 0, opacity: 0.8 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sess.title || 'New Conversation'}
                </span>
              </div>
              <button
                onClick={(e) => handleDeleteSession(sess.id, e)}
                style={{
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 0.6,
                  padding: 2,
                }}
                title="Delete chat"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* User Card & Sign Out */}
        {user && (
          <div style={{
            padding: '14px 16px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            background: 'var(--bg-secondary)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--bg-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <UserIcon size={16} color="var(--text-muted)" />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                }}>
                  {user.name || 'PEC Student'}
                </span>
                <span style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                }}>
                  {user.email}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                color: 'var(--rose)',
                fontWeight: 600,
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                padding: 0,
              }}
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        )}
      </aside>

      {/* ─── Main Chat Panel ─── */}
      <main className="main-content">
        <header className="page-header" style={{ position: 'sticky', top: 0, zIndex: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="btn btn-secondary"
                style={{ padding: '6px 10px', height: 34 }}
                title="Open sidebar"
              >
                <Menu size={16} />
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} color="var(--indigo)" />
              <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
                {activeSession?.title || 'PEC Assistant Chat'}
              </h2>
            </div>
          </div>

          <span className="badge badge-emerald">PEC Verified Portal</span>
        </header>

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '920px',
          margin: '0 auto',
          width: '100%',
          padding: '0 20px',
          height: 'calc(100vh - 61px)',
        }}>
          {/* Thread messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}>
            {currentMessages.length === 0 ? (
              <div className="empty-state" style={{ margin: 'auto 0' }}>
                <img
                  src="/pec-logo.png"
                  alt="PEC Logo"
                  style={{ height: 48, width: 'auto', marginBottom: 12, objectFit: 'contain' }}
                />
                <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Welcome to Punjab Engineering College Assistant
                </h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto 20px' }}>
                  Ask any question regarding PEC courses, academic regulations, fees, scholarships, or departmental schedules.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSendMessage(s)}
                      className="btn btn-secondary btn-sm"
                      style={{ borderRadius: 99, background: 'var(--bg-card)', padding: '6px 14px' }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {currentMessages.map((m) =>
              m.role === 'user' ? (
                <div
                  key={m.id}
                  style={{
                    alignSelf: 'flex-end',
                    maxWidth: '75%',
                    background: 'var(--indigo)',
                    color: '#fff',
                    padding: '12px 16px',
                    borderRadius: '16px 16px 2px 16px',
                    fontSize: 13.5,
                    lineHeight: 1.5,
                    boxShadow: 'var(--shadow-sm)',
                    wordBreak: 'break-word',
                  }}
                >
                  {m.text}
                </div>
              ) : (
                <div
                  key={m.id}
                  className="card"
                  style={{
                    borderLeft: '4px solid var(--indigo)',
                    borderRadius: 'var(--radius-lg)',
                    maxWidth: '100%',
                    padding: '16px 20px',
                    background: 'var(--bg-card)',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 10,
                    color: 'var(--indigo)',
                    fontWeight: 700,
                    fontSize: 13,
                  }}>
                    <Bot size={16} />
                    <span>PEC AI Assistant</span>
                  </div>

                  <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)' }}>
                    {m.result?.answer}
                  </div>

                  {m.result?.sources?.length > 0 && (
                    <div style={{
                      marginTop: 14,
                      paddingTop: 10,
                      borderTop: '1px solid var(--border)',
                      fontSize: 12,
                      color: 'var(--text-muted)',
                    }}>
                      <span style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Sources &amp; References:</span>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {m.result.sources.map((s, idx) => (
                          <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <BookOpen size={12} color="var(--indigo)" />
                            <a
                              href={s.url || '#'}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: 'var(--indigo)', textDecoration: 'underline' }}
                            >
                              {s.title} {s.page ? `(${s.page})` : ''}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            )}

            {busy && (
              <div className="loading" style={{ padding: 12 }}>
                <div className="spinner" />
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Searching official PEC documents...</span>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              display: 'flex',
              gap: 10,
              padding: '16px 0 24px',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about PEC academics, fees, scholarships, or rules..."
              className="form-input"
              style={{
                flex: 1,
                height: 48,
                fontSize: 13.5,
                borderRadius: 'var(--radius-lg)',
                padding: '0 16px',
                background: 'var(--bg-card)',
              }}
              disabled={busy}
            />
            <button
              className="btn btn-primary"
              type="submit"
              disabled={busy || !input.trim()}
              style={{ height: 48, padding: '0 20px', borderRadius: 'var(--radius-lg)' }}
            >
              <Send size={15} />
              <span>Send</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
