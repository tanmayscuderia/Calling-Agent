'use client';
import { useEffect, useState, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function ConversationsPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const qc = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMsgCount = useRef(0);

  // Conversation list — 5s polling via refetchInterval (was manual setInterval)
  const convQ = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api('/api/conversations'),
    refetchInterval: 5000,
  });
  const conversations: any[] = convQ.data?.conversations ?? [];
  const loading = convQ.isLoading;

  // Auto-select first conversation once list arrives
  useEffect(() => {
    if (!selected && conversations.length > 0) setSelected(conversations[0].id);
  }, [conversations, selected]);

  // Active conversation messages — 5s polling, per-conversation cache
  const msgQ = useQuery({
    queryKey: ['messages', selected],
    queryFn: () => api(`/api/conversations/${selected}`),
    enabled: !!selected,
    refetchInterval: 5000,
  });
  const messages: any[] = msgQ.data?.conversation?.messages ?? msgQ.data?.messages ?? [];

  const sendMut = useMutation({
    mutationFn: (text: string) =>
      api(`/api/conversations/${selected}/send`, { method: 'POST', body: { text } }),
    onSuccess: () => {
      setInput('');
      qc.invalidateQueries({ queryKey: ['messages', selected] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
  const sending = sendMut.isPending;
  const send = () => {
    if (!input.trim() || !selected) return;
    sendMut.mutate(input);
  };

  // AI toggle — optimistic cache update, revert on failure
  const toggleMut = useMutation({
    mutationFn: (v: { id: string; ai_enabled: boolean }) =>
      api(`/api/conversations/${v.id}`, {
        method: 'PATCH',
        body: { ai_enabled: v.ai_enabled, human_handoff: false },
      }),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: ['conversations'] });
      const prev = qc.getQueryData(['conversations']);
      qc.setQueryData(['conversations'], (old: any) => ({
        ...old,
        conversations: (old?.conversations ?? []).map((c: any) =>
          c.id === v.id ? { ...c, ai_enabled: v.ai_enabled, human_handoff: false } : c
        ),
      }));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['conversations'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  });
  const toggleAi = () => {
    if (!activeConv) return;
    toggleMut.mutate({ id: activeConv.id, ai_enabled: !activeConv.ai_enabled });
  };

  const activeConv = conversations.find((c) => c.id === selected);

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>Conversations</h1>
        <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>WhatsApp inbox — monitor AI replies and take over</p>
      </div>

      <div className="card" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: Conversation List */}
        <div style={{ width: 300, borderRight: '1px solid #e2e8f0', overflowY: 'auto' }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ padding: 16, borderBottom: '1px solid #e2e8f0' }}>
                <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 12, width: '80%' }} />
              </div>
            ))
          ) : conversations.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              No conversations yet.<br />Connect WhatsApp to start.
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelected(conv.id)}
                style={{
                  padding: 16,
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer',
                  background: selected === conv.id ? '#eff6ff' : 'transparent',
                  transition: 'background-color 100ms',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                    {conv.customer_name || conv.customer_phone || 'Unknown'}
                  </span>
                  {conv.ai_enabled ? (
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999, background: '#dcfce7', color: '#16a34a', fontWeight: 600 }}>AI</span>
                  ) : (
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999, background: '#fee2e2', color: '#dc2626', fontWeight: 600 }}>OFF</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {conv.summary || conv.last_message_at ? 'Tap to view' : 'No messages'}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: Chat */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {activeConv ? (
            <>
              <div style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{activeConv.customer_name || activeConv.customer_phone || 'Unknown'}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{activeConv.customer_phone || ''}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* AI Toggle Button */}
                  <button
                    onClick={toggleAi}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      border: `1px solid ${activeConv.ai_enabled ? '#86efac' : '#fca5a5'}`,
                      background: activeConv.ai_enabled ? '#dcfce7' : '#fee2e2',
                      color: activeConv.ai_enabled ? '#16a34a' : '#dc2626',
                      cursor: 'pointer',
                    }}
                  >
                    {activeConv.ai_enabled ? '🤖 AI ON' : '🚫 AI OFF'}
                  </button>
                  <span className={`badge ${activeConv.status === 'open' ? 'badge-green' : 'badge-slate'}`} style={{ textTransform: 'capitalize' }}>
                    {activeConv.status}
                  </span>
                </div>
              </div>

              <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 8, background: '#f8fafc' }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: 40 }}>No messages in this conversation</div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: msg.direction === 'inbound' ? 'flex-start' : 'flex-end' }}>
                      <div
                        className="anim-in"
                        style={{
                          maxWidth: '65%',
                          padding: '10px 14px',
                          borderRadius: msg.direction === 'inbound' ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                          background: msg.direction === 'inbound' ? '#ffffff' : '#2563eb',
                          color: msg.direction === 'inbound' ? '#0f172a' : 'white',
                          fontSize: 14,
                          boxShadow: '0px 1px 2px rgba(0,0,0,0.06)',
                        }}
                      >
                        {msg.body}
                        {msg.ai_generated && <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 6 }}>🤖 AI</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ padding: 16, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 8 }}>
                <input
                  className="input"
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !sending && send()}
                  disabled={sending}
                />
                <button className="btn btn-primary" onClick={send} disabled={sending || !input.trim()}>
                  Send
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              Select a conversation
            </div>
          )}
        </div>
      </div>
    </div>
  );
}