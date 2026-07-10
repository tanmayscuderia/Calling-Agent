'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

function fmtMoney(n?: number) {
  if (!n) return '—';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(0)}L`;
  return `₹${n}`;
}

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<{ project: any; units: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [editUnit, setEditUnit] = useState<any>(null);

  const load = () => {
    setLoading(true);
    api(`/api/inventory/projects/${id}`)
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm('Delete this unit?')) return;
    await api(`/api/inventory/units/${unitId}`, { method: 'DELETE' });
    load();
  };

  const handleDeleteProject = async () => {
    if (!confirm('Delete this entire project and all units?')) return;
    await api(`/api/inventory/projects/${id}`, { method: 'DELETE' });
    router.push('/dashboard/inventory');
  };

  const toggleUnitStatus = async (unit: any) => {
    const newStatus = unit.availability_status === 'available' ? 'inactive' : 'available';
    await api(`/api/inventory/units/${unit.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ availability_status: newStatus }),
    });
    load();
  };

  const project = data?.project;
  const units = data?.units ?? [];

  if (loading) {
    return (
      <div style={{ maxWidth: 1000 }}>
        <div className="skeleton" style={{ height: 200, borderRadius: 16, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 120, borderRadius: 16 }} />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="card" style={{ padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
        <div style={{ color: '#64748b', marginBottom: 16 }}>Project not found</div>
        <Link href="/dashboard/inventory"><button className="btn-primary">Back to Inventory</button></Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000 }}>
      {showUnitForm && (
        <UnitFormModal
          projectId={id}
          unit={editUnit}
          onClose={() => { setShowUnitForm(false); setEditUnit(null); }}
          onSaved={() => { setShowUnitForm(false); setEditUnit(null); load(); }}
        />
      )}

      {/* Breadcrumb */}
      <div style={{ marginBottom: 16 }}>
        <Link href="/dashboard/inventory" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>← Inventory</Link>
      </div>

      {/* Header */}
      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>{project.name}</h1>
            <div style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
              {[project.developer_name, project.sector, project.city, project.address].filter(Boolean).join(' · ')}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <span className={`badge ${project.status === 'active' ? 'badge-green' : 'badge-slate'}`}>{project.status}</span>
              <span className="badge badge-slate">{project.project_type || 'residential'}</span>
              {project.possession_date && <span className="badge badge-slate">Possession: {project.possession_date?.split('T')[0]}</span>}
              {project.rera_number && <span className="badge badge-slate">RERA: {project.rera_number}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href={`/dashboard/inventory?edit=${project.id}`}><button className="btn-ghost" onClick={() => {}}>✏️ Edit</button></Link>
            <button className="btn-ghost" style={{ color: '#ef4444' }} onClick={handleDeleteProject}>🗑️ Delete</button>
          </div>
        </div>

        {project.description && (
          <div style={{ marginTop: 16, padding: '12px 0', borderTop: '1px solid #f1f5f9', fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
            {project.description}
          </div>
        )}

        {project.amenities?.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Amenities</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {project.amenities.map((a: string) => (
                <span key={a} className="badge badge-slate">{a}</span>
              ))}
            </div>
          </div>
        )}

        {project.brochure_url && (
          <div style={{ marginTop: 16 }}>
            <a href={project.brochure_url} target="_blank" rel="noopener noreferrer">
              <button className="btn-primary">📄 View Brochure</button>
            </a>
          </div>
        )}
      </div>

      {/* Units */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Units ({units.length})</h2>
          <button className="btn-primary" onClick={() => { setEditUnit(null); setShowUnitForm(true); }}>+ Add Unit</button>
        </div>

        {units.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 14 }}>
            No units yet. Add one to make this property searchable by AI.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {units.map((u) => (
              <div key={u.id} style={{ padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{u.configuration || 'Unit'}</span>
                    <span className="tnum" style={{ color: '#2563eb', fontWeight: 700 }}>{fmtMoney(u.price_min)} – {fmtMoney(u.price_max)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {[u.unit_type, u.super_area_sqft ? `${u.super_area_sqft} sqft` : null, u.possession_status, u.facing ? `Facing: ${u.facing}` : null].filter(Boolean).join(' · ')}
                  </div>
                  {u.description && <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{u.description}</div>}
                  <div style={{ marginTop: 6 }}>
                    <span className={`badge ${u.availability_status === 'available' ? 'badge-green' : 'badge-slate'}`}>{u.availability_status}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => toggleUnitStatus(u)}>
                    {u.availability_status === 'available' ? '🔒 Mark Inactive' : '✅ Mark Available'}
                  </button>
                  <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => { setEditUnit(u); setShowUnitForm(true); }}>✏️</button>
                  <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 8px', color: '#ef4444' }} onClick={() => handleDeleteUnit(u.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Inline Unit Form Modal ──────────────────────────────────
function UnitFormModal({ projectId, unit, onClose, onSaved }: { projectId: string; unit?: any; onClose: () => void; onSaved: () => void; }) {
  const [form, setForm] = useState({
    configuration: '3BHK',
    unit_type: 'apartment',
    title: '',
    price_min: '',
    price_max: '',
    super_area_sqft: '',
    carpet_area_sqft: '',
    builtup_area_sqft: '',
    possession_status: 'under_construction',
    availability_status: 'available',
    facing: '',
    furnishing: '',
    parking: '',
    description: '',
    brochure_url: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (unit) {
      setForm({
        configuration: unit.configuration ?? '3BHK',
        unit_type: unit.unit_type ?? 'apartment',
        title: unit.title ?? '',
        price_min: unit.price_min?.toString() ?? '',
        price_max: unit.price_max?.toString() ?? '',
        super_area_sqft: unit.super_area_sqft?.toString() ?? '',
        carpet_area_sqft: unit.carpet_area_sqft?.toString() ?? '',
        builtup_area_sqft: unit.builtup_area_sqft?.toString() ?? '',
        possession_status: unit.possession_status ?? 'under_construction',
        availability_status: unit.availability_status ?? 'available',
        facing: unit.facing ?? '',
        furnishing: unit.furnishing ?? '',
        parking: unit.parking ?? '',
        description: unit.description ?? '',
        brochure_url: unit.brochure_url ?? '',
      });
    }
  }, [unit]);

  const upd = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const payload: any = {
        configuration: form.configuration,
        unit_type: form.unit_type,
        title: form.title || `${form.configuration} unit`,
        price_min: form.price_min ? Number(form.price_min) : null,
        price_max: form.price_max ? Number(form.price_max) : null,
        super_area_sqft: form.super_area_sqft ? Number(form.super_area_sqft) : null,
        carpet_area_sqft: form.carpet_area_sqft ? Number(form.carpet_area_sqft) : null,
        builtup_area_sqft: form.builtup_area_sqft ? Number(form.builtup_area_sqft) : null,
        possession_status: form.possession_status,
        availability_status: form.availability_status,
        facing: form.facing || null,
        furnishing: form.furnishing || null,
        parking: form.parking || null,
        description: form.description || null,
        brochure_url: form.brochure_url || null,
      };

      if (unit) {
        await api(`/api/inventory/units/${unit.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/api/inventory/units', { method: 'POST', body: JSON.stringify({ ...payload, project_id: projectId }) });
      }
      onSaved();
    } catch {
      setSaving(false);
    }
  };

  const is = { width: '100%' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div className="card" style={{ maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 24 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{unit ? 'Edit Unit' : 'Add Unit'}</h2>
          <button className="btn-ghost" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          <select className="input" style={is} value={form.configuration} onChange={(e) => upd('configuration', e.target.value)}>
            <option value="1BHK">1BHK</option><option value="2BHK">2BHK</option><option value="3BHK">3BHK</option><option value="4BHK">4BHK</option><option value="Villa">Villa</option><option value="Plot">Plot</option>
          </select>
          <select className="input" style={is} value={form.unit_type} onChange={(e) => upd('unit_type', e.target.value)}>
            <option value="apartment">Apartment</option><option value="villa">Villa</option><option value="plot">Plot</option><option value="penthouse">Penthouse</option>
          </select>
          <input className="input tnum" style={is} type="number" placeholder="Price Min (₹)" value={form.price_min} onChange={(e) => upd('price_min', e.target.value)} />
          <input className="input tnum" style={is} type="number" placeholder="Price Max (₹)" value={form.price_max} onChange={(e) => upd('price_max', e.target.value)} />
          <input className="input tnum" style={is} type="number" placeholder="Super Area (sqft)" value={form.super_area_sqft} onChange={(e) => upd('super_area_sqft', e.target.value)} />
          <input className="input tnum" style={is} type="number" placeholder="Carpet Area (sqft)" value={form.carpet_area_sqft} onChange={(e) => upd('carpet_area_sqft', e.target.value)} />
          <select className="input" style={is} value={form.possession_status} onChange={(e) => upd('possession_status', e.target.value)}>
            <option value="under_construction">Under Construction</option><option value="ready_to_move">Ready to Move</option><option value="resale">Resale</option>
          </select>
          <select className="input" style={is} value={form.availability_status} onChange={(e) => upd('availability_status', e.target.value)}>
            <option value="available">Available</option><option value="reserved">Reserved</option><option value="sold">Sold</option><option value="inactive">Inactive</option>
          </select>
          <input className="input" style={is} placeholder="Facing" value={form.facing} onChange={(e) => upd('facing', e.target.value)} />
          <input className="input" style={is} placeholder="Furnishing" value={form.furnishing} onChange={(e) => upd('furnishing', e.target.value)} />
          <input className="input" style={is} placeholder="Brochure URL" value={form.brochure_url} onChange={(e) => upd('brochure_url', e.target.value)} />
          <input className="input" style={is} placeholder="Parking" value={form.parking} onChange={(e) => upd('parking', e.target.value)} />
        </div>
        <textarea className="input" style={{ ...is, minHeight: 60, marginBottom: 16, resize: 'vertical' }} placeholder="Description" value={form.description} onChange={(e) => upd('description', e.target.value)} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Unit'}</button>
        </div>
      </div>
    </div>
  );
}