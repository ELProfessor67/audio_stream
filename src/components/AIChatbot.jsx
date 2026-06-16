'use client';
import { useState, useRef, useEffect } from 'react';

const BOT_AVATAR = '🎙️';

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: "Hi! I'm the HGC Radio Assistant 🎵 I can help you with going live, managing songs, schedules, DJ setup, and anything else on the platform. What do you need help with?",
};

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '10px 14px', background: '#f1f5f9', borderRadius: '16px 16px 16px 4px', width: 'fit-content', maxWidth: '80%' }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: '#94a3b8',
            animation: 'hgc-bounce 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

function ChatMessage({ role, content }) {
  const isUser = role === 'user';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: '8px',
        marginBottom: '12px',
      }}
    >
      {!isUser && (
        <div style={{ fontSize: '18px', flexShrink: 0, marginBottom: '2px' }}>{BOT_AVATAR}</div>
      )}
      <div
        style={{
          maxWidth: '78%',
          padding: '10px 14px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: isUser
            ? 'linear-gradient(135deg, #e11d48, #f00000)'
            : '#f1f5f9',
          color: isUser ? '#fff' : '#1e293b',
          fontSize: '13.5px',
          lineHeight: '1.55',
          wordBreak: 'break-word',
          boxShadow: isUser ? '0 2px 8px rgba(240,0,0,0.25)' : '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        {content}
      </div>
    </div>
  );
}

export default function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(1);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      const reply = data.reply || "Sorry, I couldn't get a response. Please try again.";
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      if (!open) setUnread((u) => u + 1);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '⚠️ Connection error. Please check your network and try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <style>{`
        @keyframes hgc-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
        @keyframes hgc-slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes hgc-pulse-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        .hgc-bubble:hover { transform: scale(1.08); }
        .hgc-send:hover:not(:disabled) { background: #c00 !important; }
        .hgc-input:focus { outline: none; }
        .hgc-msgs::-webkit-scrollbar { width: 4px; }
        .hgc-msgs::-webkit-scrollbar-track { background: transparent; }
        .hgc-msgs::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
      `}</style>

      {/* Floating bubble */}
      <div style={{ position: 'fixed', bottom: '28px', right: '28px', zIndex: 9999 }}>
        {/* Pulse ring (only when closed) */}
        {!open && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '2px solid #f00000',
              animation: 'hgc-pulse-ring 1.8s ease-out infinite',
              pointerEvents: 'none',
            }}
          />
        )}

        <button
          className="hgc-bubble"
          onClick={() => setOpen((o) => !o)}
          title="HGC Radio Assistant"
          style={{
            width: '58px',
            height: '58px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f00000, #b91c1c)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(240,0,0,0.45)',
            transition: 'transform 0.2s ease',
            position: 'relative',
          }}
        >
          {/* Icon */}
          {open ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          )}

          {/* Unread badge */}
          {!open && unread > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#fff',
                color: '#f00000',
                fontSize: '11px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #f00000',
                lineHeight: 1,
              }}
            >
              {unread}
            </div>
          )}
        </button>

        {/* Chat panel */}
        {open && (
          <div
            style={{
              position: 'absolute',
              bottom: '72px',
              right: '0',
              width: '340px',
              maxHeight: '520px',
              background: '#fff',
              borderRadius: '20px',
              boxShadow: '0 12px 48px rgba(0,0,0,0.18)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'hgc-slide-up 0.22s ease-out',
            }}
          >
            {/* Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #f00000, #b91c1c)',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  flexShrink: 0,
                }}
              >
                🎙️
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: '700', fontSize: '14px', lineHeight: 1.2 }}>HGC Radio Assistant</div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                  Online · Powered by AI
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', lineHeight: 1 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div
              className="hgc-msgs"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 14px 8px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {messages.map((msg, i) => (
                <ChatMessage key={i} role={msg.role} content={msg.content} />
              ))}
              {loading && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '18px' }}>{BOT_AVATAR}</div>
                  <TypingIndicator />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick prompts */}
            {messages.length === 1 && (
              <div style={{ padding: '0 14px 8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['How do I go live?', 'How to add a DJ?', 'How to schedule a show?', 'What is Auto DJ?'].map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); }}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '99px',
                      border: '1.5px solid #fecaca',
                      background: '#fff5f5',
                      color: '#b91c1c',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      transition: 'all 0.15s',
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div
              style={{
                padding: '10px 12px',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#fafafa',
              }}
            >
              <textarea
                ref={inputRef}
                className="hgc-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask me anything..."
                rows={1}
                style={{
                  flex: 1,
                  resize: 'none',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '9px 12px',
                  fontSize: '13px',
                  lineHeight: '1.4',
                  background: '#fff',
                  color: '#1e293b',
                  maxHeight: '80px',
                  overflowY: 'auto',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#f00000'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; }}
              />
              <button
                className="hgc-send"
                onClick={handleSend}
                disabled={!input.trim() || loading}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: input.trim() && !loading ? '#f00000' : '#e2e8f0',
                  border: 'none',
                  cursor: input.trim() && !loading ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background 0.2s',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={input.trim() && !loading ? '#fff' : '#94a3b8'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', padding: '6px', fontSize: '10.5px', color: '#94a3b8', borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>
              HGC Radio · AI Assistant
            </div>
          </div>
        )}
      </div>
    </>
  );
}
