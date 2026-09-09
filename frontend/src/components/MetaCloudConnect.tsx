'use client';

/**
 * Meta Cloud API connect panel — the "official WhatsApp Business API"
 * half of the dual-provider onboarding (companion to the Baileys QR flow).
 *
 * Three sections:
 *   1. Connected Meta accounts (badges, status, disconnect)
 *   2. Connect form (Phone Number ID + access token + verify token + 2FA PIN)
 *      → POST /api/whatsapp/meta/connect (backend verifies against Meta,
 *        encrypts secrets, registers the number for our webhook)
 *   3. Webhook setup helper (callback URL + verify token + instructions,
 *        from GET /api/whatsapp/meta/webhook-info)
 *
 * Secrets are write-only from the UI — the backend never echoes them back.
 */

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';

interface MetaAccount {
  id: string;
  label: string;
  phone_number: string | null;
  status: string;
  phone_number_id: string | null;
  waba_id: string | null;
  last_connected_at: string | null;
  last_error: string | null;
  created_at: string;
}

interface WebhookInfo {
  ok: boolean;
  webhookUrl: string;
  signatureVerification: string;
  accounts: any[];
  instructions: string[];
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #e2e8f0',
  fontSize: 13,
  outline: 'none',
  background: 'white',
  color: '#0f172a',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: '#475569',
  marginBottom: 6,
  letterSpacing: '0.02em',
};

function generateVerifyToken(): string {
  const bytes = new Uint8Array(24);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export default function MetaCloudConnect() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<MetaAccount[]>([]);
  const [info, setInfo] = useState<WebhookInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  // Form state
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [pin, setPin] = useState('');
  const [label, setLabel] = useState('');
  const [showToken, setShowToken] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [acc, wh] = await Promise.all([
        api('/api/whatsapp/meta/accounts'),
        api('/api/whatsapp/meta/webhook-info'),
      ]);
      setAccounts(acc?.accounts ?? []);
      setInfo(wh ?? null);
    } catch {
      // silent — the page already has an offline banner
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const connect = async () => {
    if (!phoneNumberId.trim() || !accessToken.trim()) {
      toast.error('Phone Number ID and Access Token are required.');
      return;
    }
    if (pin && !/^\d{6}$/.test(pin)) {
      toast.error('2FA PIN must be exactly 6 digits (Meta WhatsApp Manager → Two-step verification).');
      return;
    }
    setConnecting(true);
    try {
      const res = await api('/api/whatsapp/meta/connect', {
        method: 'POST',
        body: {
          phoneNumberId: phoneNumberId.trim(),
          wabaId: wabaId.trim() || undefined,
          accessToken: accessToken.trim(),
          verifyToken: verifyToken.trim() || undefined,
          pin: pin.trim() || undefined,
          label: label.trim() || undefined,
        },
      });
      toast.success(res?.phone ? `Connected: ${res.phone}` : 'Meta Cloud API connected.', 6000);
      toast.info('Now set the webhook in Meta App Dashboard → WhatsApp → Configuration (panel below).', 9000);
      setPhoneNumberId(''); setWabaId(''); setAccessToken(''); setPin(''); setLabel('');
      await refresh();
    } catch (e: any) {
      // api() throws "status: body" — surface Meta's message verbatim.
      let msg = e?.message ?? String(e);
      try {
        const body = msg.includes(': ') ? msg.slice(msg.indexOf(': ') + 2) : msg;
        const parsed = JSON.parse(body);
        if (parsed?.error) msg = parsed.error;
      } catch { /* keep raw */ }
      toast.error(`Connect failed: ${msg}`, 8000);
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async (accountId: string, label: string) => {
    try {
      await api('/api/whatsapp/meta/disconnect', { method: 'POST', body: { accountId } });
      toast.success(`${label} disconnected.`);
      await refresh();
    } catch (e: any) {
      toast.error(`Disconnect failed: ${e?.message ?? e}`);
    }
  };

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${what} copied.`);
    } catch {
      toast.error('Clipboard unavailable — select and copy manually.');
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      connected: { bg: '#dcfce7', color: '#16a34a', label: 'Connected' },
      disconnected: { bg: '#f1f5f9', color: '#64748b', label: 'Disconnected' },
      error: { bg: '#fee2e2', color: '#dc2626', label: 'Error' },
      qr_pending: { bg: '#fef3c7', color: '#d97706', label: 'QR pending' },
    };
    const s = map[status] ?? map.disconnected;
    return (
      <span style={{ padding: '3px 10px', borderRadius: 20, background: s.bg, color: s.color, fontSize: 11, fontWeight: 700 }}>
        {s.label}
      </span>
    );
  };

  return (
    <div
      className="card"
      style={{ padding: 20, marginBottom: 16, borderLeft: '4px solid #25d366' }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          cursor: 'pointer',
        }}
        onClick={() => setOpen((o) => !o)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>✅</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
              Official WhatsApp Business API{' '}
              <span style={{ fontSize: 10, fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '3px 8px', borderRadius: 12, verticalAlign: 'middle', marginLeft: 4 }}>
                RECOMMENDED
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 3 }}>
              Meta Cloud API — no ban risk, delivery receipts, free for customer-initiated chats.
              {accounts.length > 0 && ` ${accounts.length} account${accounts.length > 1 ? 's' : ''} connected.`}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 18, color: '#94a3b8', flexShrink: 0 }}>{open ? '▾' : '▸'}</div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            {/* Connected accounts */}
            {!loading && accounts.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 8, letterSpacing: '0.04em' }}>
                  CONNECTED META ACCOUNTS
                </div>
                {accounts.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      marginBottom: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ fontSize: 16 }}>📞</span>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                        {a.label} {a.phone_number ? <span style={{ color: '#64748b', fontWeight: 500 }}>· {a.phone_number}</span> : null}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                        PNID: {a.phone_number_id ?? '—'}{a.waba_id ? ` · WABA: ${a.waba_id}` : ''}
                      </div>
                      {a.last_error && (
                        <div style={{ fontSize: 11, color: '#dc2626', marginTop: 2 }}>{a.last_error}</div>
                      )}
                    </div>
                    {statusBadge(a.status)}
                    <button
                      onClick={() => disconnect(a.id, a.label)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 8,
                        border: '1px solid #fecaca',
                        background: 'white',
                        color: '#dc2626',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Disconnect
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Connect form */}
            <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                Connect a number
              </div>
              <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 12, lineHeight: 1.5 }}>
                From <strong>Meta App Dashboard → WhatsApp → API Setup</strong>: copy the Phone
                Number ID and a permanent access token (System User token, never a temporary one).
                Optional but recommended: WABA ID, a webhook verify token, and the 6-digit 2FA PIN
                so your number is <em>registered to this app</em> (without it, inbound events may
                route elsewhere).
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Phone Number ID *</label>
                  <input style={inputStyle} value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} placeholder="e.g. 123456789012345" />
                </div>
                <div>
                  <label style={labelStyle}>WABA ID (optional)</label>
                  <input style={inputStyle} value={wabaId} onChange={(e) => setWabaId(e.target.value)} placeholder="e.g. 987654321098765" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Permanent Access Token *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      style={{ ...inputStyle, fontFamily: 'monospace' }}
                      type={showToken ? 'text' : 'password'}
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="EAAG… (encrypted AES-256-GCM before storage)"
                    />
                    <button onClick={() => setShowToken((s) => !s)} style={{ padding: '0 12px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 12 }}>
                      {showToken ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Webhook Verify Token</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input style={{ ...inputStyle, fontFamily: 'monospace' }} value={verifyToken} onChange={(e) => setVerifyToken(e.target.value)} placeholder="any long random string" />
                    <button onClick={() => setVerifyToken(generateVerifyToken())} title="Generate a secure token" style={{ padding: '0 12px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }}>
                      Generate
                    </button>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>2FA PIN (6 digits)</label>
                  <input style={inputStyle} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="from Two-step verification" inputMode="numeric" />
                </div>
                <div>
                  <label style={labelStyle}>Label (optional)</label>
                  <input style={inputStyle} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Sales line" />
                </div>
              </div>

              <button
                onClick={connect}
                disabled={connecting}
                style={{
                  marginTop: 14,
                  padding: '10px 22px',
                  borderRadius: 10,
                  border: 'none',
                  background: connecting ? '#94a3b8' : 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: connecting ? 'wait' : 'pointer',
                  boxShadow: '0 4px 14px rgba(22,163,74,0.25)',
                }}
              >
                {connecting ? 'Verifying with Meta…' : 'Connect official number'}
              </button>
            </div>

            {/* Webhook setup helper */}
            {info && (
              <div style={{ marginTop: 14, padding: 16, borderRadius: 12, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#1e40af', marginBottom: 8 }}>
                  After connecting — set the webhook in Meta App Dashboard
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  <code style={{ flex: 1, minWidth: 240, background: '#0f172a', color: '#e2e8f0', padding: '8px 12px', borderRadius: 8, fontSize: 12, wordBreak: 'break-all' }}>
                    {info.webhookUrl}
                  </code>
                  <button onClick={() => copy(info.webhookUrl, 'Webhook URL')} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #bfdbfe', background: 'white', color: '#1e40af', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Copy URL
                  </button>
                </div>
                <div style={{ fontSize: 11, color: info.signatureVerification.startsWith('DISABLED') ? '#dc2626' : '#166534', fontWeight: 700, marginBottom: 8 }}>
                  Signature verification: {info.signatureVerification}
                </div>
                <ol style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: '#1e3a8a', lineHeight: 1.7 }}>
                  {info.instructions.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

