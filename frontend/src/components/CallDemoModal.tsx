'use client';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';

interface Props {
  leadId: string;
  leadName?: string;
  onClose: () => void;
}

interface Turn {
  speaker: 'agent' | 'customer' | 'system';
  text: string;
}

export default function CallDemoModal({ leadId, leadName, onClose }: Props) {
  const [callSessionId, setCallSessionId] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [callStatus, setCallStatus] = useState<'connecting' | 'in_progress' | 'ended'>('connecting');
  const [duration, setDuration] = useState(0);
  const [summary, setSummary] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Start call on mount
  useEffect(() => {
    startCall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Duration timer
  useEffect(() => {
    if (callStatus !== 'in_progress') return;
    const t = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, [callStatus]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns]);

  // Speak with browser TTS
  const speak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
    // Try to use a female voice for "Priya"
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find((v) => /female|samantha|google uk english female|priya/i.test(v.name));
    if (femaleVoice) utterance.voice = femaleVoice;
    window.speechSynthesis.speak(utterance);
  };

  const startCall = async () => {
    setLoading(true);
    try {
      const res = await api('/api/calls/start-demo', { method: 'POST', body: { leadId } });
      setCallSessionId(res.callSessionId);
      if (res.openingLine) {
        setTurns([{ speaker: 'agent', text: res.openingLine }]);
        speak(res.openingLine);
      }
      setCallStatus('in_progress');
    } catch (e) {
      setTurns([{ speaker: 'system', text: 'Failed to start call. Check backend connection.' }]);
    }
    setLoading(false);
  };

  const sendReply = async () => {
    if (!input.trim() || !callSessionId || loading) return;
    const customerText = input.trim();
    setInput('');
    setTurns((prev) => [...prev, { speaker: 'customer', text: customerText }]);
    setLoading(true);
    try {
      const res = await api(`/api/calls/${callSessionId}/turn`, {
        method: 'POST',
        body: { speaker: 'customer', text: customerText },
      });
      if (res.agentReply) {
        setTurns((prev) => [...prev, { speaker: 'agent', text: res.agentReply }]);
        speak(res.agentReply);
      }
    } catch {
      setTurns((prev) => [...prev, { speaker: 'system', text: 'Error getting AI response.' }]);
    }
    setLoading(false);
  };

  const endCall = async () => {
    if (!callSessionId) { onClose(); return; }
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    setLoading(true);
    setCallStatus('ended');
    try {
      const res = await api(`/api/calls/${callSessionId}/end`, { method: 'POST' });
      setSummary(res);
    } catch {}
    setLoading(false);
  };

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
        animation: 'fadeInUp 0.2s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{
          width: '100%',
          maxWidth: 560,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Call Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: callStatus === 'in_progress' ? '#dcfce7' : '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                position: 'relative',
              }}
            >
              🎙️
              {callStatus === 'in_progress' && (
                <div className="pulse-dot" style={{ position: 'absolute', top: -2, right: -2, width: 12, height: 12, borderRadius: '50%', background: '#16a34a', border: '2px solid white' }} />
              )}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Priya — AI Calling Agent</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Calling: {leadName || 'Lead'} {callStatus === 'in_progress' && <span className="tnum">· {fmtTime(duration)}</span>}
              </div>
            </div>
          </div>
          {callStatus === 'in_progress' && (
            <button className="btn btn-danger" style={{ minHeight: 36, padding: '6px 16px', fontSize: 13 }} onClick={endCall} disabled={loading}>
              End Call
            </button>
          )}
        </div>

        {/* Summary (when ended) */}
        {callStatus === 'ended' && summary ? (
          <div style={{ padding: 24, overflowY: 'auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Call Ended</div>
              <div className="tnum" style={{ fontSize: 13, color: '#64748b' }}>Duration: {fmtTime(duration)}</div>
            </div>
            {summary.summary && (
              <div style={{ padding: 16, borderRadius: 12, background: '#f8fafc', marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Summary</div>
                <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>{summary.summary}</div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {summary.outcome && <span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>{summary.outcome.replace(/_/g, ' ')}</span>}
              {summary.leadTemperature && <span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>{summary.leadTemperature}</span>}
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 20 }} onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            {/* Transcript */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 10, background: '#f8fafc', minHeight: 300 }}>
              {turns.map((turn, i) => (
                <div
                  key={i}
                  className="anim-in"
                  style={{
                    display: 'flex',
                    justifyContent: turn.speaker === 'customer' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '75%',
                      padding: '10px 14px',
                      borderRadius: turn.speaker === 'customer' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: turn.speaker === 'customer' ? '#2563eb' : turn.speaker === 'system' ? '#fef3c7' : '#ffffff',
                      color: turn.speaker === 'customer' ? 'white' : turn.speaker === 'system' ? '#92400e' : '#0f172a',
                      fontSize: 14,
                      lineHeight: 1.5,
                      boxShadow: '0px 1px 2px rgba(0,0,0,0.06)',
                    }}
                  >
                    {turn.speaker === 'agent' && <span style={{ fontSize: 11, opacity: 0.6, display: 'block', marginBottom: 2 }}>🎙️ Priya</span>}
                    {turn.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: '#ffffff', fontSize: 14 }}>
                    <span className="pulse-dot" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#94a3b8', marginRight: 4 }} />
                    <span className="pulse-dot" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#94a3b8', marginRight: 4, animationDelay: '0.2s' }} />
                    <span className="pulse-dot" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#94a3b8', animationDelay: '0.4s' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            {callStatus === 'in_progress' && (
              <div style={{ padding: 16, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 8 }}>
                <input
                  className="input"
                  placeholder="Customer says..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendReply()}
                  disabled={loading}
                  autoFocus
                />
                <button className="btn btn-primary" onClick={sendReply} disabled={loading || !input.trim()}>
                  Send
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}