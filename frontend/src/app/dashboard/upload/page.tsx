'use client';
import { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';
import Link from 'next/link';

const csvTemplate = `project_name,developer_name,city,sector,location,configuration,price_min,price_max,possession_status,possession_date,status,amenities,description,brochure_url
Demo Heights,Demo Realty,Noida,Sector 150,Noida Sector 150,3BHK,16500000,21000000,under_construction,2027-12-31,active,clubhouse;parking;green area;security,Premium residential near expressway,https://example.com/brochure.pdf
Demo Heights,Demo Realty,Noida,Sector 150,Noida Sector 150,2BHK,9500000,12500000,under_construction,2027-12-31,active,clubhouse;parking;green area;security,Premium residential near expressway,https://example.com/brochure.pdf
ATS Knightsbridge,ATS,Noida,Sector 124,Noida Sector 124,4BHK,75000000,120000000,ready,2024-01-01,active,clubhouse;pool;gym;security;power backup,Luxury ready-to-move apartments,https://example.com/ats.pdf
Godrej Tropical Isle,Godrej,Noida,Sector 146,Noida Sector 146,3BHK,22000000,32000000,under_construction,2028-06-30,active,clubhouse;pool;gym;tropical gardens,Tropical-themed premium living,https://example.com/godrej.pdf
Central Noida Residency,CNR,Noida,Sector 76,Noida Sector 76,2BHK,9500000,12500000,ready,2023-06-01,active,parking;gym;security,Affordable ready-to-move in central Noida,https://example.com/cnr.pdf
Luxury Greens Villa,Luxury Greens,Greater Noida West,Gaur City,Greater Noida West,Villa,28000000,40000000,under_construction,2027-03-31,active,private garden;parking;clubhouse;gated community,Spacious luxury villas with private gardens,https://example.com/lgv.pdf`;

const downloadSampleCsv = () => {
  const blob = new Blob([csvTemplate], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sample-properties.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const toast = useToast();
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
      toast.error(e.message || 'Upload failed');
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


        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn btn-primary" onClick={upload} disabled={!file || uploading}>
            {uploading ? 'Uploading...' : 'Upload CSV'}
          </button>
          <button className="btn btn-secondary" onClick={() => { setFile(null); setResult(null); }} disabled={!file}>
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
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-ghost"
              style={{ minHeight: 32, padding: '4px 12px', fontSize: 13 }}
              onClick={downloadSampleCsv}
            >
              ⬇ Download Sample CSV
            </button>
            <button
              className="btn btn-ghost"
              style={{ minHeight: 32, padding: '4px 12px', fontSize: 13 }}
              onClick={() => navigator.clipboard.writeText(csvTemplate)}
            >
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