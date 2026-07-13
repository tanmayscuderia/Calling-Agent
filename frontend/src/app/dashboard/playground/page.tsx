'use client';
import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';

interface SimResult {
  reply: string;
  extractedData: Record<string, any>;
  matchedProperties: Array<Record<string, any>>;
  leadUpdates: Record<string, any>;
}

interface Turn {
  role: 'user' | 'assistant';
  text: string;
  result?: SimResult;
}

const SUGGESTIONS = [
  'Hi, I am looking for a 3BHK in Noida around 2 crore',
  'End use, possession by 2027 is fine',
  'Yes call me today evening',
  'Do you have any 2BHK under 1.5 crore ready to move?',
];

export default function PlaygroundPage() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    setError(null);
    setInput('');
    // Capture history BEFORE adding the new user turn, then add it to state
    const history = turns.map((t) => ({ role: t.role, text: t.text }));
    setTurns((prev) => [...prev, { role: 'user', text }]);
    setLoading(true);
    try {
      const res = await api('/api/ai/simulate', {
        method: 'POST',
        body: { text, history },
      });
      setTurns((prev) => [
        ...prev,
        { role: 'assistant', text: res.reply, result: res },
      ]);
    } catch (e: any) {
      setError(e.message || 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setTurns([]);
    setError(null);
  };

  return (
    <div className="stagger" style={{ maxWidth: 900, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.03em' }}>
            AI Playground
          </h1>
          <p style={{ color: '#475569', fontSize: 15, margin: 0 }}>
            Test the WhatsApp AI agent without a phone — type a customer message and see the reply, extracted intent, and matched properties
          </p>
        </div>
        {turns.length > 0 && (
          <button onClick={reset} className="btn-secondary" style={{ fontSize: 13 }}>
            Reset
          </button>
        )}
      </div>

      {/* Chat area */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', marginBottom: 16, paddingRight: 4 }}>
        {turns.length === 0 && !loading && (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🧪</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Test the AI Agent</h3>
            <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 24px' }}>
              Try one of these sample messages to see how the AI qualifies leads and matches properties:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 500, margin: '0 auto' }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="card-hover"
                  style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    fontSize: 14,
                    color: '#334155',
                    textAlign: 'left',
                  }}
                >
                  &ldquo;{s}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}

        {turns.map((turn, i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            {/* Message bubble */}
            <div
              style={{
                display: 'flex',
                justifyContent: turn.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: turn.result ? 8 : 0,
              }}
            >
              <div
                style={{
                  maxWidth: '75%',
                  padding: '12px 16px',
                  borderRadius: 16,
                  fontSize: 14,
                  lineHeight: 1.5,
                  background: turn.role === 'user' ? '#2563eb' : '#f1f5f9',
                  color: turn.role === 'user' ? 'white' : '#1e293b',
                  borderBottomRightRadius: turn.role === 'user' ? 4 : 16,
                  borderBottomLeftRadius: turn.role === 'user' ? 16 : 4,
                }}
              >
                {turn.text}
              </div>
            </div>

            {/* AI analysis expandable */}
            {turn.result && (
              <div className="card" style={{ padding: 16, marginBottom: 8, fontSize: 13 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {/* Extracted data */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                      🎯 Extracted Intent
                    </div>
                    {Object.entries(turn.result.extractedData || {}).filter(([, v]) => v != null && v !== '').length === 0 ? (
                      <span style={{ color: '#94a3b8' }}>No data extracted yet</span>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {Object.entries(turn.result.extractedData || {})
                          .filter(([, v]) => v != null && v !== '')
                          .map(([k, v]) => (
                            <span key={k} style={{ fontSize: 12, padding: '3px 8px', borderRadius: 6, background: '#ede9fe', color: '#5b21b6', fontWeight: 500 }}>
                              {k}: {String(v)}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Matched properties */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                      🏠 Matched Properties ({turn.result.matchedProperties?.length ?? 0})
                    </div>
                    {turn.result.matchedProperties?.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {turn.result.matchedProperties.map((p, j) => (
                          <div key={j} style={{ fontSize: 12, color: '#334155' }}>
                            • {p.reason || p.projectName || 'Match'} {(p.score || p.matchScore) && <span style={{ color: '#16a34a', fontWeight: 600 }}>{Math.round((p.score || p.matchScore) * 100)}%</span>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>No matches</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '12px 16px', borderRadius: 16, borderBottomLeftRadius: 4, background: '#f1f5f9', color: '#64748b', fontSize: 14 }}>
              <span className="pulse-dot-inline" /> AI thinking…
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding: 16, borderRadius: 12, background: '#fee2e2', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0 }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          style={{ display: 'flex', gap: 8 }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a customer message…"
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              fontSize: 14,
              outline: 'none',
            }}
            autoFocus
          />
          <button type="submit" disabled={!input.trim() || loading} className="btn-primary" style={{ fontSize: 14, padding: '12px 24px' }}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}