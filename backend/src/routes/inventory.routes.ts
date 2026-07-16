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
import {
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  searchItems,
} from '../crm/inventoryItemService';
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

  // ── Real Estate Search ────────────────────────────────

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

  // ── Generic Inventory Items (non-real-estate) ─────────

  app.get('/api/inventory/items', async (req) => {
    const q = req.query as any;
    const result = await listItems(orgId(req), {
      category: q.category || undefined,
      city: q.city || undefined,
      status: q.status || undefined,
      limit: q.limit ? Number(q.limit) : 50,
      offset: q.offset ? Number(q.offset) : 0,
    });
    return result;
  });

  app.get('/api/inventory/items/:id', async (req) => {
    const id = (req.params as any).id;
    const item = await getItem(orgId(req), id);
    return { item };
  });

  app.post('/api/inventory/items', async (req) => {
    const item = await createItem(orgId(req), req.body as any);
    return { item };
  });

  app.patch('/api/inventory/items/:id', async (req) => {
    const id = (req.params as any).id;
    const item = await updateItem(orgId(req), id, req.body as any);
    return { item };
  });

  app.delete('/api/inventory/items/:id', async (req) => {
    const id = (req.params as any).id;
    await deleteItem(orgId(req), id);
    return { success: true };
  });

  // ── Generic Inventory Search ──────────────────────────

  app.get('/api/inventory/items/search', async (req) => {
    const q = req.query as any;
    const matches = await searchItems({
      orgId: orgId(req),
      query: q.query || null,
      category: q.category || null,
      city: q.city || null,
      location: q.location || null,
      budgetMin: q.budgetMin ? Number(q.budgetMin) : null,
      budgetMax: q.budgetMax ? Number(q.budgetMax) : null,
      limit: q.limit ? Number(q.limit) : 3,
    });
    return { matches };
  });
}