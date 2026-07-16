'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';

interface ChatInfo {
  id: string;
  name: string;
  isGroup: boolean;
  phone?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  monitored: boolean;
  unreadCount?: number;
}

export default function WhatsAppPage() {
  const toast = useToast();
  const [status, setStatus] = useState<any>(null);
  const [chats, setChats] = useState<ChatInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'groups' | 'individuals'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Simulator state
  const [simText, setSimText] = useState('');
  const [simPhone, setSimPhone] = useState('919999999999');
  const [simDeliver, setSimDeliver] = useState(true);
  const [simLoading, setSimLoading] = useState(false);
  const [simReply, setSimReply] = useState<string | null>(null);
  const [simQuickReplies, setSimQuickReplies] = useState<string[]>([]);
  const [simError, setSimError] = useState<string | null>(null);

  const fetchStatus = useCallback(() =>
    api('/api/whatsapp/status')
      .then((r) => { setStatus(r); setOffline(false); })
      .catch((e) => { if (e?.message === 'BACKEND_UNREACHABLE') setOffline(true); }), []);

  const fetchChats = useCallback(() =>
    api('/api/whatsapp/chats')
      .then((r) => {
        const newChats = r.chats || [];
        setChats(newChats);
        // Prune selectedIds for chats that no longer exist
        setSelectedIds(prev => {
          const validIds = new Set(newChats.map((c: ChatInfo) => c.id));
          const pruned = new Set<string>();
          prev.forEach(id => { if (validIds.has(id)) pruned.add(id); });
          return pruned;
        });
      })
      .catch(() => {}), []);

  useEffect(() => {
    fetchStatus();
    const t1 = setInterval(fetchStatus, 3000);
    return () => clearInterval(t1);
  }, []);

  useEffect(() => {
    // FIX: Fetch chats whenever an adapter exists (even if disconnected).
    // Chats are loaded from disk by the backend, so they're available immediately
    // after backend restart — no need to wait for WhatsApp to fully reconnect.
    if (status?.adapter) {
      fetchChats();
      const t2 = setInterval(fetchChats, 5000);
      return () => clearInterval(t2);
    }
  }, [status?.adapter?.status, status?.adapter != null]);

  const start = () => {
    setLoading(true);
    api('/api/whatsapp/start', { method: 'POST' })
      .then((r) => { setStatus(r); setOffline(false); })
      .catch((e) => { if (e?.message === 'BACKEND_UNREACHABLE') setOffline(true); })
      .finally(() => setLoading(false));
  };
  const stop = () => api('/api/whatsapp/stop', { method: 'POST' }).then(() => { fetchStatus(); setChats([]); });

  const relink = () => {
    setLoading(true);
    api('/api/whatsapp/relink', { method: 'POST' })
      .then((r) => { setStatus(r); setOffline(false); setChats([]); })
      .catch((e) => { if (e?.message === 'BACKEND_UNREACHABLE') setOffline(true); })
      .finally(() => setLoading(false));
  };

  const toggleChat = (chatId: string) => {
    api(`/api/whatsapp/chats/${encodeURIComponent(chatId)}/toggle`, { method: 'POST' })
      .then(() => fetchChats())
      .catch(() => {});
  };

  // ── Bulk selection helpers ────────────────────────────────
  const filteredChats = useMemo(() => {
    return chats.filter((c) => {
      if (filter === 'groups' && !c.isGroup) return false;
      if (filter === 'individuals' && c.isGroup) return false;
      if (search) {
        const s = search.toLowerCase();
        return c.name.toLowerCase().includes(s) || (c.phone && c.phone.includes(s)) || c.id.includes(s);
      }
      return true;
    });
  }, [chats, filter, search]);

  const allVisibleSelected = filteredChats.length > 0 && filteredChats.every(c => selectedIds.has(c.id));
  const someVisibleSelected = filteredChats.some(c => selectedIds.has(c.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      // Deselect only the visible ones
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredChats.forEach(c => next.delete(c.id));
        return next;
      });
    } else {
      // Select all visible
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredChats.forEach(c => next.add(c.id));
        return next;
      });
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deselectAll = () => setSelectedIds(new Set());

  const selectByType = (isGroup: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      chats.filter(c => c.isGroup === isGroup).forEach(c => next.add(c.id));
      return next;
    });
  };

  const bulkToggleMonitored = async (monitored: boolean) => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      await api('/api/whatsapp/chats/bulk-toggle', {
        method: 'POST',
        body: { chatIds: Array.from(selectedIds), monitored },
      });
      await fetchChats();
      setSelectedIds(new Set());
    } catch (e: any) {
      console.error('bulkToggleMonitored failed:', e?.message || e);
      toast.error(`Failed to ${monitored ? 'monitor' : 'pause'} chats: ${e?.message || e}`);
    } finally {
      setBulkLoading(false);
    }
  };

  const runSimulation = async () => {
    if (!simText.trim()) return;
    setSimLoading(true);
    setSimReply(null);
    setSimQuickReplies([]);
    setSimError(null);
    try {
      const r = await api('/api/whatsapp/simulate', {
        method: 'POST',
        body: {
          text: simText.trim(),
          phone: simPhone.trim() || '919999999999',
          deliverToChatId: simDeliver
            ? status?.adapter?.connectedPhone || undefined
            : undefined,
        },
      });
      setSimReply(r.reply);
      setSimQuickReplies(r.quickReplies || []);
    } catch (e: any) {
      setSimError(e?.message || 'Simulator failed');
    } finally {
      setSimLoading(false);
    }
  };

  const adapterStatus = status?.adapter?.status ?? 'unknown';
  const connectedPhone = status?.adapter?.connectedPhone;
  const qrString = status?.adapter?.qr ?? null;
  const cfg = status?.config;

  const statusConfig: Record<string, { color: string; bg: string; grad: string; label: string; dot: boolean; emoji: string }> = {
    connected: { color: '#16a34a', bg: '#dcfce7', grad: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)', label: 'Connected', dot: true, emoji: '✅' },
    disconnected: { color: '#64748b', bg: '#f1f5f9', grad: 'linear-gradient(135deg, #64748b 0%, #475569 100%)', label: 'Disconnected', dot: false, emoji: '📱' },
    qr_pending: { color: '#d97706', bg: '#fef3c7', grad: 'linear-gradient(135deg, #d97706 0%, #ea580c 100%)', label: 'Awaiting QR Scan', dot: true, emoji: '📱' },
    error: { color: '#dc2626', bg: '#fee2e2', grad: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', label: 'Error', dot: false, emoji: '❌' },
    disabled: { color: '#64748b', bg: '#f1f5f9', grad: 'linear-gradient(135deg, #64748b 0%, #475569 100%)', label: 'Disabled', dot: false, emoji: '📵' },
    unknown: { color: '#64748b', bg: '#f1f5f9', grad: 'linear-gradient(135deg, #64748b 0%, #475569 100%)', label: 'Unknown', dot: false, emoji: '?' },
  };

  const sc = statusConfig[adapterStatus] || statusConfig.unknown;

  const groupChats = filteredChats.filter((c) => c.isGroup);
  const individualChats = filteredChats.filter((c) => !c.isGroup);
  const monitoredCount = chats.filter((c) => c.monitored).length;
  const selectedCount = selectedIds.size;

  return (
    <div style={{ maxWidth: 920 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>WhatsApp Bridge</h1>
        <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>Monitor chats, manage AI auto-reply, and connect via Baileys (prototype)</p>
      </div>

      {/* Backend Offline Banner */}
      {offline && (
        <div className="card" style={{ padding: 20, marginBottom: 16, borderLeft: '4px solid #dc2626' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>⚠️</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#dc2626' }}>Backend Not Running</div>
              <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>
                Run: <code style={{ background: '#0f172a', color: '#e2e8f0', padding: '2px 8px', borderRadius: 6 }}>cd backend && npm run dev</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Status Banner */}
      <div
        style={{
          background: sc.grad,
          borderRadius: 16,
          padding: '28px 32px',
          marginBottom: 16,
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}
      >
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', bottom: -40, right: 40, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, position: 'relative', zIndex: 1 }}>
          {/* Status icon */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              position: 'relative',
              flexShrink: 0,
            }}
          >
            {sc.emoji}
            {sc.dot && (
              <div
                className="pulse-dot"
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#22c55e',
                  border: '3px solid white',
                }}
              />
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>{sc.label}</div>
            {connectedPhone && (
              <div style={{ fontSize: 15, opacity: 0.9, marginTop: 2 }}>
                +{connectedPhone.split('@')[0].split(':')[0]}
              </div>
            )}
            {adapterStatus === 'connected' && (
              <div style={{ fontSize: 13, opacity: 0.8, marginTop: 6 }}>
                {monitoredCount} of {chats.length} chats monitored · AI auto-reply {cfg?.autoReply ? 'ON' : 'OFF'}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {adapterStatus === 'disabled' ? (
              <button
                onClick={relink}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: '2px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.25)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                  backdropFilter: 'blur(4px)',
                  transition: 'all 0.2s',
                }}
              >
                {loading ? '⏳ Clearing...' : '🔗 Re-link WhatsApp'}
              </button>
            ) : (
              <button
                onClick={start}
                disabled={loading || adapterStatus === 'connected'}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: '2px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: loading || adapterStatus === 'connected' ? 'not-allowed' : 'pointer',
                  opacity: loading || adapterStatus === 'connected' ? 0.5 : 1,
                  backdropFilter: 'blur(4px)',
                  transition: 'all 0.2s',
                }}
              >
                {loading ? '⏳ Starting...' : adapterStatus === 'disconnected' ? '🔗 Start Bridge' : '🔄 Restart'}
              </button>
            )}
            {adapterStatus === 'connected' && (
              <button
                onClick={stop}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: '2px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                ⏹ Stop
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Device Unlinked Warning */}
      {adapterStatus === 'disabled' && (
        <div className="card" style={{ padding: 20, marginBottom: 16, borderLeft: '4px solid #f59e0b', background: '#fffbeb' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 24 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#92400e' }}>WhatsApp Device Unlinked</div>
              <div style={{ fontSize: 13, color: '#78350f', marginTop: 6, lineHeight: 1.6 }}>
                This device was logged out or unlinked from your phone. Click <strong>Re-link WhatsApp</strong> above to clear the old session and generate a fresh QR code.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Section */}
      {adapterStatus === 'qr_pending' && qrString && (
        <div className="card" style={{ padding: 32, marginBottom: 16, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: 20 }}>📱</span>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Scan to Connect WhatsApp</h3>
          </div>
          <div style={{ display: 'inline-block', padding: 20, borderRadius: 16, background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', marginBottom: 20 }}>
            <QRCodeCanvas value={qrString} size={240} level="H" marginSize={1} fgColor="#0f172a" />
          </div>
          <div style={{ textAlign: 'left', maxWidth: 400, margin: '0 auto' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>How to connect:</div>
            <ol style={{ fontSize: 13, color: '#475569', lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li>Open <strong>WhatsApp</strong> on your phone</li>
              <li>Go to <strong>Settings</strong> → <strong>Linked Devices</strong></li>
              <li>Tap <strong>Link a Device</strong></li>
              <li>Scan the QR code above</li>
            </ol>
          </div>
          <div style={{ marginTop: 16, padding: '8px 16px', borderRadius: 10, background: '#fef3c7', fontSize: 12, color: '#92400e', display: 'inline-block' }}>
            ⏱️ Auto-refreshes every ~20 seconds
          </div>
        </div>
      )}

      {adapterStatus === 'qr_pending' && !qrString && (
        <div className="card" style={{ padding: 32, marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Generating QR Code...</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>The QR code will appear here shortly.</div>
        </div>
      )}

      {/* Chats & Groups Monitoring Section */}
      {/* FIX: Show chats even when disconnected — they're loaded from disk */}
      {(adapterStatus === 'connected' || (chats.length > 0 && adapterStatus !== 'qr_pending' && adapterStatus !== 'disabled')) && (
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>📋 Monitored Chats</h3>
              <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>
                Toggle which chats the AI monitors. Individual chats start ON, groups start OFF.
                {adapterStatus !== 'connected' && <span style={{ color: '#d97706' }}> · Reconnecting WhatsApp…</span>}
              </p>
            </div>
            <div style={{
              padding: '6px 14px',
              borderRadius: 20,
              background: monitoredCount > 0 ? '#dcfce7' : '#f1f5f9',
              color: monitoredCount > 0 ? '#16a34a' : '#64748b',
              fontSize: 13,
              fontWeight: 700,
            }}>
              {monitoredCount} Active
            </div>
          </div>

          {/* Search & Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Search chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 4 }}>
              {(['all', 'groups', 'individuals'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    border: '1px solid',
                    borderColor: filter === f ? '#0f172a' : '#e2e8f0',
                    background: filter === f ? '#0f172a' : 'white',
                    color: filter === f ? 'white' : '#475569',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* ── Bulk Selection Toolbar ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16, padding: '8px 12px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            {/* Select All checkbox */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
              <input
                type="checkbox"
                checked={allVisibleSelected}
                ref={(el) => { if (el) el.indeterminate = !allVisibleSelected && someVisibleSelected; }}
                onChange={toggleSelectAll}
                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#0f172a' }}
              />
              {allVisibleSelected ? 'All selected' : 'Select all visible'}
            </label>
            <div style={{ width: 1, height: 20, background: '#e2e8f0' }} />
            {/* Quick select buttons */}
            <button onClick={() => selectByType(true)} style={quickSelectBtnStyle}>
              👥 All Groups
            </button>
            <button onClick={() => selectByType(false)} style={quickSelectBtnStyle}>
              👤 All Individuals
            </button>
            <button onClick={deselectAll} style={quickSelectBtnStyle}>
              ✕ Clear
            </button>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
              {selectedCount > 0 ? `${selectedCount} selected` : `${filteredChats.length} visible`}
            </span>
          </div>

          {/* ── Floating Bulk Action Bar ── */}
          {selectedCount > 0 && (
            <div style={{
              position: 'sticky',
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 20px',
              marginBottom: 12,
              borderRadius: 12,
              background: '#0f172a',
              color: 'white',
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
              zIndex: 10,
            }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                {selectedCount} chat{selectedCount !== 1 ? 's' : ''} selected
              </span>
              <div style={{ flex: 1 }} />
              <button
                onClick={() => bulkToggleMonitored(true)}
                disabled={bulkLoading}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#16a34a',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: bulkLoading ? 'not-allowed' : 'pointer',
                  opacity: bulkLoading ? 0.6 : 1,
                }}
              >
                ✅ Monitor Selected
              </button>
              <button
                onClick={() => bulkToggleMonitored(false)}
                disabled={bulkLoading}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#475569',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: bulkLoading ? 'not-allowed' : 'pointer',
                  opacity: bulkLoading ? 0.6 : 1,
                }}
              >
                ⏸ Pause Selected
              </button>
              <button
                onClick={deselectAll}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Chat List */}
          {filteredChats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 14 }}>
              {chats.length === 0 ? '📨 No chats synced yet. Send/receive a message to populate the list.' : 'No chats match your filter.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Group chats */}
              {groupChats.length > 0 && (
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '8px 4px 4px' }}>
                  👥 Groups ({groupChats.length})
                </div>
              )}
              {groupChats.map((chat) => (
                <ChatRow key={chat.id} chat={chat} onToggle={toggleChat} selected={selectedIds.has(chat.id)} onSelect={toggleSelectRow} />
              ))}

              {/* Individual chats */}
              {individualChats.length > 0 && (
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '16px 4px 4px' }}>
                  👤 Individual Chats ({individualChats.length})
                </div>
              )}
              {individualChats.map((chat) => (
                <ChatRow key={chat.id} chat={chat} onToggle={toggleChat} selected={selectedIds.has(chat.id)} onSelect={toggleSelectRow} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Config Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <ConfigTile label="Auto Reply" value={cfg?.autoReply ? 'ON' : 'OFF'} color={cfg?.autoReply ? '#16a34a' : '#94a3b8'} />
        <ConfigTile label="Ignore Groups" value={cfg?.ignoreGroups ? 'Yes' : 'No'} color={cfg?.ignoreGroups ? '#d97706' : '#64748b'} />
        <ConfigTile label="Business" value={cfg?.businessName || '—'} color="#6366f1" />
        <ConfigTile label="Allowlist" value={cfg?.allowedNumbers?.length > 0 ? `${cfg.allowedNumbers.length} nums` : 'Open'} color="#0891b2" />
      </div>

      {/* AI Pipeline Info Banner */}
      <div style={{ padding: 16, borderRadius: 12, background: '#f0fdf4', fontSize: 13, color: '#166534', lineHeight: 1.6, marginBottom: 16 }}>
        <strong>🤖 How AI replies work:</strong> When a chat is <strong>monitored</strong> (green toggle ON), any incoming message automatically triggers the AI pipeline — lead creation, intent extraction, inventory search, AI reply generation, and WhatsApp reply — all in real-time. No manual action needed.
      </div>

      {/* ── SIMULATOR PANEL ── */}
      <div className="card" style={{ padding: 24, marginBottom: 16, border: '2px solid #6366f1' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 18 }}>🧪</span>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>WhatsApp AI Simulator</h3>
        </div>
        <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 16px' }}>
          Inject a fake inbound customer message into the full AI pipeline (lead creation, intent extraction, inventory search, AI reply).
          No WhatsApp connection needed for the pipeline test — toggle delivery to also send the reply to your phone.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
              Customer Message
            </label>
            <textarea
              value={simText}
              onChange={(e) => setSimText(e.target.value)}
              placeholder="Hi, I am looking for a 3BHK in Noida around 2 crore"
              rows={2}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) runSimulation(); }}
              style={simInputStyle}
            />
          </div>
          <div style={{ width: 180 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
              Customer Phone
            </label>
            <input
              type="text"
              value={simPhone}
              onChange={(e) => setSimPhone(e.target.value)}
              placeholder="919999999999"
              style={simInputStyle}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={simDeliver}
              onChange={(e) => setSimDeliver(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#6366f1' }}
            />
            Deliver reply to my WhatsApp
          </label>
          {simDeliver && status?.adapter?.status !== 'connected' && (
            <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>
              ⚠️ Bridge not connected — reply will be generated but not delivered
            </span>
          )}
          <div style={{ flex: 1 }} />
          <button
            onClick={runSimulation}
            disabled={simLoading || !simText.trim()}
            style={{
              padding: '10px 24px',
              borderRadius: 10,
              border: 'none',
              background: simLoading || !simText.trim() ? '#cbd5e1' : '#6366f1',
              color: 'white',
              fontWeight: 700,
              fontSize: 13,
              cursor: simLoading || !simText.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {simLoading ? '🤖 AI thinking...' : '▶ Run Simulation'}
          </button>
        </div>

        {/* AI Reply Display */}
        {simReply !== null && (
          <div style={{ marginTop: 16, borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <div style={{ background: '#6366f1', color: 'white', padding: '8px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              🤖 AI Reply
            </div>
            <div style={{ padding: 16, background: '#faf5ff', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {simReply || '(no reply — AI disabled or human handoff)'}
            </div>
            {simQuickReplies.length > 0 && (
              <div style={{ padding: '0 16px 16px', background: '#faf5ff', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {simQuickReplies.map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => setSimText(chip)}
                    style={{
                      padding: '6px 14px', borderRadius: 20, border: '1px solid #c4b5fd',
                      background: 'white', color: '#6366f1', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {simError && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: '#fee2e2', color: '#dc2626', fontSize: 13 }}>
            ❌ {simError}
          </div>
        )}

        {/* Quick test scripts */}
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Quick test scripts:</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              'Hi, I am looking for a 3BHK in Noida around 2 crore',
              'End use, possession by 2027 is fine',
              'Yes call me today evening',
            ].map((script, i) => (
              <button
                key={i}
                onClick={() => setSimText(script)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  color: '#475569',
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer',
                  maxWidth: 300,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={script}
              >
                {i + 1}. {script}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Production Note */}
      <div style={{ padding: 16, borderRadius: 12, background: '#eff6ff', fontSize: 13, color: '#1e40af', lineHeight: 1.6 }}>
        <strong>Production Note:</strong> This prototype uses a WhatsApp Web bridge for fast demo. Production will use Meta Cloud API. The AI, CRM, and inventory workflows remain the same.
      </div>
    </div>
  );
}

const quickSelectBtnStyle: React.CSSProperties = {
  padding: '4px 12px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  background: 'white',
  color: '#475569',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s',
};

function ChatRow({ chat, onToggle, selected, onSelect }: {
  chat: ChatInfo;
  onToggle: (id: string) => void;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        borderRadius: 12,
        background: selected ? '#eff6ff' : (chat.monitored ? '#f0fdf4' : '#f8fafc'),
        border: `1px solid ${selected ? '#bfdbfe' : (chat.monitored ? '#bbf7d0' : '#e2e8f0')}`,
        transition: 'all 0.15s',
      }}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onSelect(chat.id)}
        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#2563eb', flexShrink: 0 }}
      />

      {/* Avatar */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: chat.isGroup ? '#fbbf24' : '#60a5fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        {chat.isGroup ? '👥' : '👤'}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {chat.name || chat.phone || 'Unknown'}
        </div>
        <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {chat.lastMessage || chat.phone || chat.id}
        </div>
      </div>

      {/* Badge */}
      {chat.unreadCount && chat.unreadCount > 0 && (
        <div style={{
          padding: '2px 8px',
          borderRadius: 10,
          background: '#3b82f6',
          color: 'white',
          fontSize: 11,
          fontWeight: 700,
          flexShrink: 0,
        }}>
          {chat.unreadCount}
        </div>
      )}

      {/* Toggle Switch */}
      <button
        onClick={() => onToggle(chat.id)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          background: chat.monitored ? '#16a34a' : '#cbd5e1',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0,
        }}
        title={chat.monitored ? 'AI is monitoring — click to pause' : 'AI paused — click to enable'}
      >
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: chat.monitored ? 22 : 2,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'white',
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
      </button>

      {/* Status label */}
      <div style={{ width: 50, textAlign: 'right', flexShrink: 0 }}>
        {chat.monitored ? (
          <span style={{ fontSize: 11, fontWeight: 600, color: '#16a34a' }}>Active</span>
        ) : (
          <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>Paused</span>
        )}
      </div>
    </div>
  );
}

const simInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #e2e8f0',
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
  resize: 'none',
};

function ConfigTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ padding: 16, borderRadius: 12, background: 'white', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}