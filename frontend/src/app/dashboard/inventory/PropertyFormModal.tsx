'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Props {
  project?: any | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function PropertyFormModal({ project, onClose, onSaved }: Props) {
  const isEdit = !!project;
  const [form, setForm] = useState({
    name: '',
    developer_name: '',
    city: '',
    sector: '',
    location: '',
    address: '',
    project_type: 'residential',
    status: 'active',
    possession_date: '',
    rera_number: '',
    description: '',
    amenities: '',
    brochure_url: '',
    latitude: '',
    longitude: '',
    // Unit fields
    configuration: '3BHK',
    unit_type: 'apartment',
    price_min: '',
    price_max: '',
    super_area_sqft: '',
    possession_status: 'under_construction',
    availability_status: 'available',
    unit_description: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (project) {
      setForm((f) => ({
        ...f,
        name: project.name ?? '',
        developer_name: project.developer_name ?? '',
        city: project.city ?? '',
        sector: project.sector ?? '',
        location: project.location ?? '',
        address: project.address ?? '',
        project_type: project.project_type ?? 'residential',
        status: project.status ?? 'active',
        possession_date: project.possession_date ?? '',
        rera_number: project.rera_number ?? '',
        description: project.description ?? '',
        amenities: Array.isArray(project.amenities) ? project.amenities.join(', ') : '',
        brochure_url: project.brochure_url ?? '',
        latitude: project.latitude != null ? String(project.latitude) : '',
        longitude: project.longitude != null ? String(project.longitude) : '',
      }));
    }
  }, [project]);

  const upd = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (!form.name.trim()) { setError('Project name is required'); setSaving(false); return; }

      const amenitiesArray = form.amenities
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const projectData: any = {
        name: form.name.trim(),
        developer_name: form.developer_name || null,
        city: form.city || null,
        sector: form.sector || null,
        location: form.location || null,
        address: form.address || null,
        project_type: form.project_type,
        status: form.status,
        possession_date: form.possession_date || null,
        rera_number: form.rera_number || null,
        description: form.description || null,
        amenities: amenitiesArray.length ? amenitiesArray : [],
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
      };

      if (isEdit) {
        await api(`/api/inventory/projects/${project.id}`, {
          method: 'PATCH',
          body: projectData,
        });
      } else {
        const res = await api('/api/inventory/projects', {
          method: 'POST',
          body: projectData,
        });

        // Always auto-create a unit so the property is searchable by AI
        if (form.configuration) {
          await api('/api/inventory/units', {
            method: 'POST',
            body: {
              project_id: res.project.id,
              title: `${form.configuration} in ${form.name.trim()}`,
              configuration: form.configuration,
              unit_type: form.unit_type,
              price_min: Number(form.price_min) || null,
              price_max: Number(form.price_max) || null,
              super_area_sqft: Number(form.super_area_sqft) || null,
              possession_status: form.possession_status,
              availability_status: form.availability_status,
              brochure_url: form.brochure_url || null,
              description: form.unit_description || null,
            },
          });
        }
      }
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = { width: '100%', marginBottom: 8 };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div className="card" style={{ maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 24 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{isEdit ? 'Edit Property' : 'Add Property'}</h2>
          <button className="btn-ghost" onClick={onClose}>✕</button>
        </div>

        {error && <div style={{ padding: '8px 12px', borderRadius: 8, background: '#fef2f2', color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Project Details</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8, marginBottom: 16 }}>
          <div style={{ gridColumn: 'span 2' }}>
            <input className="input" style={inputStyle} placeholder="Project Name *" value={form.name} onChange={(e) => upd('name', e.target.value)} />
          </div>
          <input className="input" style={inputStyle} placeholder="Developer" value={form.developer_name} onChange={(e) => upd('developer_name', e.target.value)} />
          <input className="input" style={inputStyle} placeholder="City" value={form.city} onChange={(e) => upd('city', e.target.value)} />
          <input className="input" style={inputStyle} placeholder="Sector" value={form.sector} onChange={(e) => upd('sector', e.target.value)} />
          <input className="input" style={inputStyle} placeholder="Location" value={form.location} onChange={(e) => upd('location', e.target.value)} />
          <div style={{ gridColumn: 'span 2' }}>
            <input className="input" style={inputStyle} placeholder="Address" value={form.address} onChange={(e) => upd('address', e.target.value)} />
          </div>
          <input className="input" style={inputStyle} placeholder="RERA Number" value={form.rera_number} onChange={(e) => upd('rera_number', e.target.value)} />
          <input className="input" style={inputStyle} type="date" placeholder="Possession Date" value={form.possession_date?.split('T')[0] ?? ''} onChange={(e) => upd('possession_date', e.target.value)} />
          <input className="input" style={inputStyle} placeholder="Brochure URL" value={form.brochure_url} onChange={(e) => upd('brochure_url', e.target.value)} />
          <input className="input tnum" style={inputStyle} type="number" step="any" placeholder="Latitude" value={form.latitude} onChange={(e) => upd('latitude', e.target.value)} />
          <input className="input tnum" style={inputStyle} type="number" step="any" placeholder="Longitude" value={form.longitude} onChange={(e) => upd('longitude', e.target.value)} />
          <select className="input" style={inputStyle} value={form.status} onChange={(e) => upd('status', e.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="sold_out">Sold Out</option>
            <option value="archived">Archived</option>
          </select>
          <div style={{ gridColumn: 'span 2' }}>
            <input className="input" style={inputStyle} placeholder="Amenities (comma separated)" value={form.amenities} onChange={(e) => upd('amenities', e.target.value)} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <textarea className="input" style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} placeholder="Project Description" value={form.description} onChange={(e) => upd('description', e.target.value)} />
          </div>
        </div>

        {!isEdit && (
          <>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Initial Unit (Optional)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8, marginBottom: 16 }}>
              <select className="input" style={inputStyle} value={form.configuration} onChange={(e) => upd('configuration', e.target.value)}>
                <option value="1BHK">1BHK</option>
                <option value="2BHK">2BHK</option>
                <option value="3BHK">3BHK</option>
                <option value="4BHK">4BHK</option>
                <option value="Villa">Villa</option>
                <option value="Plot">Plot</option>
              </select>
              <select className="input" style={inputStyle} value={form.unit_type} onChange={(e) => upd('unit_type', e.target.value)}>
                <option value="apartment">Apartment</option>
                <option value="villa">Villa</option>
                <option value="plot">Plot</option>
                <option value="penthouse">Penthouse</option>
                <option value="studio">Studio</option>
              </select>
              <input className="input tnum" style={inputStyle} type="number" placeholder="Price Min (₹)" value={form.price_min} onChange={(e) => upd('price_min', e.target.value)} />
              <input className="input tnum" style={inputStyle} type="number" placeholder="Price Max (₹)" value={form.price_max} onChange={(e) => upd('price_max', e.target.value)} />
              <input className="input tnum" style={inputStyle} type="number" placeholder="Super Area (sqft)" value={form.super_area_sqft} onChange={(e) => upd('super_area_sqft', e.target.value)} />
              <select className="input" style={inputStyle} value={form.possession_status} onChange={(e) => upd('possession_status', e.target.value)}>
                <option value="under_construction">Under Construction</option>
                <option value="ready_to_move">Ready to Move</option>
                <option value="resale">Resale</option>
              </select>
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Property' : 'Create Property'}
          </button>
        </div>
      </div>
    </div>
  );
}