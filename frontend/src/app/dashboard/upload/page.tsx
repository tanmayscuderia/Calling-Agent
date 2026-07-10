'use client';
import { useState, useRef } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

const csvTemplate = `project_name,developer_name,city,sector,location,configuration,price_min,price_max,possession_status,possession_date,status,amenities,description,brochure_url
Demo Heights,Demo Realty,Noida,Sector 150,Noida Sector 150,3BHK,16500000,21000000,under_construction,2027-12-31,active,clubhouse;parking;green area;security,Premium residential near expressway,https://example.com/brochure.pdf`;

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }
    setError('');
    setFile(f);
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/upload/properties-csv`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    }
    setUploading(false);
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>Upload Inventory</h1>
        <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>Import property data via CSV for AI to search and recommend</p>
      </div>

      {/* Upload Zone */}
      <div className="card" style={{ padding: 32, marginBottom: 16 }}>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragActive ? '#2563eb' : '#cbd5e1'}`,
            borderRadius: 14,
            padding: '40px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragActive ? '#eff6ff' : '#f8fafc',
            transition: 'border-color 150ms, background-color 150ms',
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div style={{ fontSize: 40, marginBottom: 8 }}>📤</div>
          {file ? (
            <>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#16a34a' }}>✅ {file.name}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Ready to upload</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Drop CSV file here or click to browse</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Supports .csv files only</div>
            </>
          )}
        </div>

        {error && <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: '#fee2e2', color: '#dc2626', fontSize: 13 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn btn-primary" onClick={upload} disabled={!file || uploading}>
            {uploading ? 'Uploading...' : 'Upload CSV'}
          </button>
          <button className="btn btn-secondary" onClick={() => { setFile(null); setResult(null); setError(''); }} disabled={!file}>
            Clear
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="card" style={{ padding: 24, marginBottom: 16, borderLeft: '4px solid #16a34a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}>✅</span>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Import Complete</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div style={{ padding: 12, borderRadius: 10, background: '#f8fafc' }}>
              <div className="tnum" style={{ fontSize: 24, fontWeight: 800, color: '#2563eb' }}>{result.batch?.total_rows ?? result.totalRows ?? 0}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Total Rows</div>
            </div>
            <div style={{ padding: 12, borderRadius: 10, background: '#f8fafc' }}>
              <div className="tnum" style={{ fontSize: 24, fontWeight: 800, color: '#16a34a' }}>{result.batch?.success_rows ?? result.successRows ?? 0}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Imported</div>
            </div>
            <div style={{ padding: 12, borderRadius: 10, background: '#f8fafc' }}>
              <div className="tnum" style={{ fontSize: 24, fontWeight: 800, color: '#dc2626' }}>{result.batch?.failed_rows ?? result.failedRows ?? 0}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Failed</div>
            </div>
          </div>
          <Link href="/dashboard/inventory" className="btn btn-ghost" style={{ marginTop: 16 }}>View Inventory →</Link>
        </div>
      )}

      {/* CSV Format */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>Expected CSV Format</h3>
          <button
            className="btn btn-ghost"
            style={{ minHeight: 32, padding: '4px 12px', fontSize: 13 }}
            onClick={() => navigator.clipboard.writeText(csvTemplate)}
          >
            Copy Template
          </button>
        </div>
        <pre style={{ fontSize: 12, background: '#0f172a', color: '#e2e8f0', padding: 16, borderRadius: 12, overflowX: 'auto', margin: 0 }}>
{csvTemplate}
        </pre>
      </div>
    </div>
  );
}