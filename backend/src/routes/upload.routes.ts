import { FastifyInstance } from 'fastify';
import { importPropertiesCsv, importGenericInventoryCsv } from '../uploads/csvImportService';
import { config } from '../config';

export async function uploadRoutes(app: FastifyInstance) {
  app.post('/api/upload/properties-csv', async (req, reply) => {
    const orgId = (req.query as any).orgId || config.defaultOrgId;

    let csvText: string | null = null;
    let fileName = 'upload.csv';

    const ct = req.headers['content-type'] || '';
    if (ct.includes('multipart/form-data')) {
      const file = await (req as any).file();
      if (!file) return reply.code(400).send({ error: 'No file uploaded' });
      csvText = await file.toBuffer();
      fileName = file.filename;
    } else {
      csvText = (req.body as any)?.text ?? (typeof req.body === 'string' ? req.body : null);
    }

    if (!csvText) return reply.code(400).send({ error: 'No CSV content' });

    try {
      const result = await importPropertiesCsv(orgId, csvText, fileName, config.defaultMemberId);
      return reply.send(result);
    } catch (e: any) {
      return reply.code(500).send({ error: e?.message ?? 'Import failed' });
    }
  });

  // Convenience: seed sample CSV
  app.post('/api/upload/seed-sample', async (req, reply) => {
    const orgId = (req.query as any).orgId || config.defaultOrgId;
    const sample = SAMPLE_CSV;
    try {
      const result = await importPropertiesCsv(orgId, sample, 'sample.csv', config.defaultMemberId);
      return reply.send(result);
    } catch (e: any) {
      return reply.code(500).send({ error: e?.message ?? 'Seed failed' });
    }
  });

  // Generic inventory CSV upload (non-real-estate industries)
  app.post('/api/upload/inventory-csv', async (req, reply) => {
    const orgId = (req.query as any).orgId || config.defaultOrgId;

    let csvText: string | null = null;
    let fileName = 'upload.csv';

    const ct = req.headers['content-type'] || '';
    if (ct.includes('multipart/form-data')) {
      const file = await (req as any).file();
      if (!file) return reply.code(400).send({ error: 'No file uploaded' });
      csvText = await file.toBuffer();
      fileName = file.filename;
    } else {
      csvText = (req.body as any)?.text ?? (typeof req.body === 'string' ? req.body : null);
    }

    if (!csvText) return reply.code(400).send({ error: 'No CSV content' });

    try {
      const result = await importGenericInventoryCsv(orgId, csvText, fileName, config.defaultMemberId);
      return reply.send(result);
    } catch (e: any) {
      return reply.code(500).send({ error: e?.message ?? 'Import failed' });
    }
  });
}

const SAMPLE_CSV = `project_name,developer_name,city,sector,location,configuration,unit_type,price_min,price_max,possession_status,status,amenities,description,brochure_url
Lodha Greens,Lodha,Mumbai,Palava,Dombivli,2BHK,apartment,6500000,8500000,under_construction,active,clubhouse,parking,green_area,Spacious 2BHK in Palava,
Lodha Greens,Lodha,Mumbai,Palava,Dombivli,3BHK,apartment,9500000,12500000,under_construction,active,clubhouse,parking,green area,Spacious 3BHK in Palava,`;