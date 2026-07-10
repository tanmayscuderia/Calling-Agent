import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: 20 }}>
      <div style={{ textAlign: 'center', maxWidth: 600 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: 'white', letterSpacing: '-0.03em', margin: '0 0 12px' }}>
          Real Estate AI
        </h1>
        <p style={{ fontSize: 18, color: '#94a3b8', margin: '0 0 32px', lineHeight: 1.6 }}>
          WhatsApp lead qualification, inventory-grounded AI replies, CRM dashboard, and calling-agent demo.
        </p>
        <Link
          href="/dashboard"
          className="btn btn-primary"
          style={{ fontSize: 16, padding: '12px 32px', minHeight: 48 }}
        >
          Open Dashboard →
        </Link>
      </div>
    </div>
  );
}