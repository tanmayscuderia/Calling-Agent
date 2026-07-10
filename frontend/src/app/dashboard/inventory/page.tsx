'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import PropertyFormModal from './PropertyFormModal';

function fmtMoney(n?: number) {
  if (!n) return '—';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(0)}L`;
  return `₹${n}`;
}

export default function InventoryPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCity, setFilterCity] = useState('');
  const [filterConfig, setFilterConfig] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState<any>(null);

  const load = () => {
    setLoading(true);
    Promise.all([api('/api/inventory/projects'), api('/api/inventory/units')])
      .then(([p, u]) => {
        const units = u.units ?? [];
        const projs = (p.projects ?? []).map((proj: any) => ({
          ...proj,
          _units: units.filter((un: any) => un.project_id === proj.id),
        }));
        setProjects(projs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm('Delete this project and all its units?')) return;
    await api(`/api/inventory/projects/${id}`, { method: 'DELETE' });
    load();
  };

  const handleEdit = (e: React.MouseEvent, proj: any) => {
    e.stopPropagation();
    e.preventDefault();
    setEditProject(proj);
    setShowForm(true);
  };

  const handleStatusToggle = async (e: React.MouseEvent, proj: any) => {
    e.stopPropagation();
    e.preventDefault();
    const newStatus = proj.status === 'active' ? 'inactive' : 'active';
    await api(`/api/inventory/projects/${proj.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    load();
  };

  const filtered = projects.filter((p) => {
    if (filterCity && p.city !== filterCity) return false;
    if (filterConfig && !p._units?.some((u: any) => u.configuration === filterConfig)) return false;
    return true;
  });

  const cities = [...new Set(projects.map((p) => p.city).filter(Boolean))];

  return (
    <div style={{ maxWidth: 1200 }}>
      {showForm && (
        <PropertyFormModal
          project={editProject}
          onClose={() => { setShowForm(false); setEditProject(null); }}
          onSaved={() => { setShowForm(false); setEditProject(null); load(); }}
        />
      )}

      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>Property Inventory</h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>{projects.length} projects · {filtered.length} shown</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditProject(null); setShowForm(true); }}>
          + Add Property
        </button>
      </div>

      <div className="card" style={{ marginBottom: 16, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <select className="input" style={{ width: 'auto' }} value={filterCity} onChange={(e) => setFilterCity(e.target.value)}>
          <option value="">All Cities</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="input" style={{ width: 'auto' }} value={filterConfig} onChange={(e) => setFilterConfig(e.target.value)}>
          <option value="">All Configurations</option>
          <option value="2BHK">2BHK</option>
          <option value="3BHK">3BHK</option>
          <option value="4BHK">4BHK</option>
          <option value="Villa">Villa</option>
        </select>
        {(filterCity || filterConfig) && (
          <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 12px' }} onClick={() => { setFilterCity(''); setFilterConfig(''); }}>Clear</button>
        )}
      </div>

      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 16 }} />)
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: 'center', gridColumn: 'span 2' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🏠</div>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>No properties found.</div>
            <button className="btn-primary" onClick={() => setShowForm(true)}>Add Your First Property</button>
          </div>
        ) : (
          filtered.map((proj) => (
            <Link key={proj.id} href={`/dashboard/inventory/${proj.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card card-hover" style={{ padding: 20, cursor: 'pointer', position: 'relative' }}>
                {/* Action buttons */}
                <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 4, zIndex: 1 }}>
                  <button className="btn-ghost" style={{ fontSize: 11, padding: '2px 8px' }} title="Edit" onClick={(e) => handleEdit(e, proj)}>✏️</button>
                  <button className="btn-ghost" style={{ fontSize: 11, padding: '2px 8px' }} title={proj.status === 'active' ? 'Deactivate' : 'Activate'} onClick={(e) => handleStatusToggle(e, proj)}>
                    {proj.status === 'active' ? '👁️' : '🚫'}
                  </button>
                  <button className="btn-ghost" style={{ fontSize: 11, padding: '2px 8px', color: '#ef4444' }} title="Delete" onClick={(e) => handleDelete(e, proj.id)}>🗑️</button>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, paddingRight: 100 }}>{proj.name}</div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>{[proj.developer_name, proj.sector, proj.city].filter(Boolean).join(' · ')}</div>
                </div>
                <span className={`badge ${proj.status === 'active' ? 'badge-green' : 'badge-slate'}`} style={{ textTransform: 'capitalize' }}>{proj.status}</span>

                {proj._units?.length > 0 ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                    {proj._units.map((u: any) => (
                      <div key={u.id} style={{ padding: '8px 12px', borderRadius: 10, background: '#f8fafc', fontSize: 12 }}>
                        <span style={{ fontWeight: 700 }}>{u.configuration}</span>
                        <span className="tnum" style={{ color: '#2563eb', marginLeft: 6 }}>{fmtMoney(u.price_min)}–{fmtMoney(u.price_max)}</span>
                        <span style={{ color: '#64748b', marginLeft: 6 }}>· {u.possession_status || '—'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>No units listed</div>
                )}
                {proj.amenities?.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 12 }}>
                    {proj.amenities.slice(0, 4).map((a: string) => (
                      <span key={a} className="badge badge-slate">{a}</span>
                    ))}
                  </div>
                )}
                {proj.brochure_url && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#2563eb' }}>📄 Brochure available</div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}