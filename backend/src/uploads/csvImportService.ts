import { parse } from 'csv-parse';
import { supabaseAdmin } from '../db/supabase';
import { logger } from '../utils/logger';

export interface CsvImportResult {
  batchId: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  errors: string[];
}

const REQUIRED = ['project_name', 'configuration', 'price_min', 'price_max'];

/**
 * Parse CSV text and import into real_estate_projects + real_estate_units.
 * Groups by project_name + city + sector (reuses existing project).
 */
export async function importPropertiesCsv(
  orgId: string,
  csvText: string,
  fileName = 'upload.csv',
  uploadedBy?: string
): Promise<CsvImportResult> {
  const sb = supabaseAdmin();

  // create batch
  const { data: batch, error: batchErr } = await sb
    .from('real_estate_import_batches')
    .insert({
      org_id: orgId,
      source_type: 'csv',
      file_name: fileName,
      status: 'processing',
      uploaded_by: uploadedBy ?? null,
    })
    .select()
    .single();
  if (batchErr) throw batchErr;

  const errors: string[] = [];
  let totalRows = 0;
  let successRows = 0;
  let failedRows = 0;

  const records: Record<string, string>[] = await new Promise((resolve, reject) => {
    const rows: Record<string, string>[] = [];
    parse(
      csvText,
      { columns: true, trim: true, skip_empty_lines: true, relax_column_count: true },
      (err, recs) => {
        if (err) reject(err);
        else resolve(recs as Record<string, string>[]);
      }
    );
  });

  // project cache to avoid duplicate lookups
  const projectCache = new Map<string, string>();

  for (const row of records) {
    totalRows++;
    try {
      const missing = REQUIRED.filter((k) => !row[k] && row[k] !== '0');
      if (missing.length) {
        failedRows++;
        errors.push(`Row ${totalRows}: missing required fields ${missing.join(', ')}`);
        continue;
      }

      const projectName = row.project_name?.trim();
      const city = row.city?.trim() || null;
      const sector = row.sector?.trim() || null;
      const cacheKey = `${projectName}|${city}|${sector}`;

      let projectId = projectCache.get(cacheKey);
      if (!projectId) {
        // find existing project
        let q = sb
          .from('real_estate_projects')
          .select('id')
          .eq('org_id', orgId)
          .eq('name', projectName)
          .limit(1);
        if (city) q = q.eq('city', city);
        if (sector) q = q.eq('sector', sector);
        const { data: existing } = await q.maybeSingle();

        if (existing) {
          projectId = existing.id;
        } else {
          const amenities = row.amenities
            ? row.amenities.split(',').map((s) => s.trim()).filter(Boolean)
            : [];
          const { data: proj, error: perr } = await sb
            .from('real_estate_projects')
            .insert({
              org_id: orgId,
              name: projectName,
              developer_name: row.developer_name?.trim() || null,
              city,
              sector,
              location: row.location?.trim() || null,
              address: row.address?.trim() || null,
              status: row.status?.trim() || 'active',
              possession_date: row.possession_date?.trim() || null,
              description: row.description?.trim() || null,
              amenities,
            })
            .select()
            .single();
          if (perr) throw new Error(`project insert: ${perr.message}`);
          projectId = proj.id;
        }
        projectCache.set(cacheKey, projectId!);
      }

      // create unit
      const { error: uerr } = await sb.from('real_estate_units').insert({
        org_id: orgId,
        project_id: projectId,
        title: row.title?.trim() || `${row.configuration} in ${projectName}`,
        configuration: row.configuration?.trim(),
        unit_type: row.unit_type?.trim() || 'apartment',
        price_min: num(row.price_min),
        price_max: num(row.price_max),
        possession_status: row.possession_status?.trim() || null,
        availability_status: 'available',
        brochure_url: row.brochure_url?.trim() || null,
        description: row.description?.trim() || null,
      });

      if (uerr) throw new Error(`unit insert: ${uerr.message}`);

      successRows++;
    } catch (e: any) {
      failedRows++;
      errors.push(`Row ${totalRows}: ${e?.message ?? 'unknown error'}`);
    }
  }

  // finalize batch
  await sb
    .from('real_estate_import_batches')
    .update({
      status: failedRows === totalRows ? 'failed' : 'completed',
      total_rows: totalRows,
      success_rows: successRows,
      failed_rows: failedRows,
      error: errors.slice(0, 20).join('\n') || null,
      processed_at: new Date().toISOString(),
    })
    .eq('id', batch.id);

  logger.info({ batchId: batch.id, totalRows, successRows, failedRows }, 'CSV import complete');
  return { batchId: batch.id, totalRows, successRows, failedRows, errors };
}

function num(v?: string): number | null {
  if (!v) return null;
  const n = Number(String(v).replace(/[^\d.-]/g, ''));
  return isNaN(n) ? null : n;
}