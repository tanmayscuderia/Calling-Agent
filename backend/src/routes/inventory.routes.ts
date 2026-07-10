import { FastifyInstance } from 'fastify';
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  listUnits,
  createUnit,
  updateUnit,
  deleteUnit,
  searchProperties,
  getProjectWithUnits,
} from '../crm/propertyService';
import { config } from '../config';

function orgId(req: any): string {
  return (req.query as any).orgId || (req.body as any)?.orgId || config.defaultOrgId;
}

export async function inventoryRoutes(app: FastifyInstance) {
  // ── Projects ──────────────────────────────────────────

  app.get('/api/inventory/projects', async (req) => {
    const projects = await listProjects(orgId(req));
    return { projects };
  });

  app.post('/api/inventory/projects', async (req) => {
    const project = await createProject(orgId(req), req.body as any);
    return { project };
  });

  app.get('/api/inventory/projects/:id', async (req) => {
    const id = (req.params as any).id;
    const data = await getProjectWithUnits(orgId(req), id);
    return data;
  });

  app.patch('/api/inventory/projects/:id', async (req) => {
    const id = (req.params as any).id;
    const project = await updateProject(orgId(req), id, req.body as any);
    return { project };
  });

  app.delete('/api/inventory/projects/:id', async (req) => {
    const id = (req.params as any).id;
    const result = await deleteProject(orgId(req), id);
    return result;
  });

  // ── Units ─────────────────────────────────────────────

  app.get('/api/inventory/units', async (req) => {
    const projectId = (req.query as any).projectId;
    const units = await listUnits(orgId(req), projectId);
    return { units };
  });

  app.post('/api/inventory/units', async (req) => {
    const unit = await createUnit(orgId(req), req.body as any);
    return { unit };
  });

  app.patch('/api/inventory/units/:id', async (req) => {
    const id = (req.params as any).id;
    const unit = await updateUnit(orgId(req), id, req.body as any);
    return { unit };
  });

  app.delete('/api/inventory/units/:id', async (req) => {
    const id = (req.params as any).id;
    const result = await deleteUnit(orgId(req), id);
    return result;
  });

  // ── Search ────────────────────────────────────────────

  app.get('/api/inventory/search', async (req) => {
    const q = req.query as any;
    const matches = await searchProperties({
      orgId: orgId(req),
      configuration: q.configuration || null,
      city: q.city || null,
      sector: q.sector || null,
      location: q.location || null,
      budgetMin: q.budgetMin ? Number(q.budgetMin) : null,
      budgetMax: q.budgetMax ? Number(q.budgetMax) : null,
      possessionStatus: q.possessionStatus || null,
      limit: q.limit ? Number(q.limit) : 3,
    });
    return { matches };
  });
}