'use client';
import { useState, useRef, useEffect } from 'react';
import { api, uploadCsv } from '@/lib/api';
import { useToast } from '@/lib/toast';
import Link from 'next/link';

// ── Real Estate CSV Template ──
const RE_CSV_TEMPLATE = `project_name,developer_name,city,sector,location,configuration,price_min,price_max,possession_status,possession_date,status,amenities,description,brochure_url
Demo Heights,Demo Realty,Noida,Sector 150,Noida Sector 150,3BHK,16500000,21000000,under_construction,2027-12-31,active,clubhouse;parking;green area;security,Premium residential near expressway,https://example.com/brochure.pdf
Demo Heights,Demo Realty,Noida,Sector 150,Noida Sector 150,2BHK,9500000,12500000,under_construction,2027-12-31,active,clubhouse;parking;green area;security,Premium residential near expressway,https://example.com/brochure.pdf
ATS Knightsbridge,ATS,Noida,Sector 124,Noida Sector 124,4BHK,75000000,120000000,ready,2024-01-01,active,clubhouse;pool;gym;security;power backup,Luxury ready-to-move apartments,https://example.com/ats.pdf`;

// ── Generic CSV Template (for non-real-estate) ──
const GENERIC_CSV_TEMPLATE = `title,subtitle,category,price_min,price_max,city,location,description,status
Premium Service Package,Our top-tier offering,premium,50000,100000,Mumbai,Bandra,Complete premium service with priority support,active
Standard Service Package,Most popular option,standard,20000,40000,Delhi,Connaught Place,Balanced service for everyday needs,active
Basic Plan,Entry-level option,basic,5000,15000,Bangalore,Indiranagar,Affordable starter package,active`;

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const toast = useToast();
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [agentConfig, setAgentConfig] = useState<any>(null);

  useEffect(() => {
    api('/api/agent/config')
      .then((r) => setAgentConfig(r.config ?? null))
      .catch(() => {});
  }, []);

  const isRealEstate = !agentConfig || agentConfig.industry === 'real_estate' || agentConfig.inventory_table === 'real_estate_units';
  const csvTemplate = isRealEstate ? RE_CSV_TEMPLATE : GENERIC_CSV_TEMPLATE;
  const itemLabel = agentConfig?.inventory_schema?.item_label ?? (isRealEstate ? 'Property' : 'Item');
  const itemLabelPlural = agentConfig?.inventory_schema?.item_label_plural ?? (isRealEstate ? 'Properties' : 'Items');

  const downloadSampleCsv = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sample-${isRealEstate ? 'properties' : 'inventory'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }
    setFile(f);
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const data = await uploadCsv(file, isRealEstate ? 'properties' : 'generic');
      setResult(data);
      toast.success(`Imported ${data.successRows ?? 0} rows successfully`);
    } catch (e: any) {
      toast.error(e.message || 'Upload failed');
    }
    setUploading(false);
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>Upload {itemLabelPlural}</h1>
        <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>
          Import {itemLabel.toLowerCase()} data via CSV for AI to search and recommend
        </p>
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

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn-primary" onClick={upload} disabled={!file || uploading}>
            {uploading ? 'Uploading...' : `Upload ${itemLabel} CSV`}
          </button>
          <button className="btn-secondary" onClick={() => { setFile(null); setResult(null); }} disabled={!file}>
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
              <div className="tnum" style={{ fontSize: 24, fontWeight: 800, color: '#2563eb' }}>{result.totalRows ?? 0}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Total Rows</div>
            </div>
            <div style={{ padding: 12, borderRadius: 10, background: '#f8fafc' }}>
              <div className="tnum" style={{ fontSize: 24, fontWeight: 800, color: '#16a34a' }}>{result.successRows ?? 0}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Imported</div>
            </div>
            <div style={{ padding: 12, borderRadius: 10, background: '#f8fafc' }}>
              <div className="tnum" style={{ fontSize: 24, fontWeight: 800, color: '#dc2626' }}>{result.failedRows ?? 0}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Failed</div>
            </div>
          </div>
          {result.errors?.length > 0 && (
            <details style={{ marginTop: 12 }}>
              <summary style={{ fontSize: 13, color: '#64748b', cursor: 'pointer' }}>View errors ({result.errors.length})</summary>
              <pre style={{ fontSize: 11, color: '#dc2626', marginTop: 8, maxHeight: 120, overflow: 'auto' }}>
                {result.errors.slice(0, 10).join('\n')}
              </pre>
            </details>
          )}
          <Link href="/dashboard/inventory" className="btn-ghost" style={{ marginTop: 16, display: 'inline-block', textDecoration: 'none' }}>
            View {itemLabelPlural} →
          </Link>
        </div>
      )}

      {/* CSV Format */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
            Expected CSV Format {!isRealEstate && '(any extra columns → attributes)'}
          </h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" style={{ fontSize: 13 }} onClick={downloadSampleCsv}>
              ⬇ Download Sample CSV
            </button>
            <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => navigator.clipboard.writeText(csvTemplate)}>
              Copy Template
            </button>
          </div>
        </div>
        <pre style={{ fontSize: 12, background: '#0f172a', color: '#e2e8f0', padding: 16, borderRadius: 12, overflowX: 'auto', margin: 0 }}>
{csvTemplate}
        </pre>
      </div>
    </div>
  );
}