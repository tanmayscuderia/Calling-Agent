import { FastifyInstance } from 'fastify';
import { listMembers } from '../crm/memberService';
import { config } from '../config';

function orgId(req: any): string {
  return (req.query as any).orgId || config.defaultOrgId;
}

export async function membersRoutes(app: FastifyInstance) {
  app.get('/api/members', async (req) => {
    const members = await listMembers(orgId(req));
    return { members };
  });
}