import { PrismaClient, UserRole, AgentType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/** One user per role, per the auth spec's seed data requirements. All
 *  share the same password for demo convenience. */
const DEMO_USERS: { email: string; firstName: string; lastName: string; role: UserRole }[] = [
  { email: 'admin@demo.studio', firstName: 'Priya', lastName: 'Okafor', role: UserRole.ORGANIZATION_ADMIN },
  { email: 'producer@demo.studio', firstName: 'Amara', lastName: 'Diallo', role: UserRole.EXECUTIVE_PRODUCER },
  { email: 'pm@demo.studio', firstName: 'Level', lastName: 'Chen', role: UserRole.PRODUCTION_MANAGER },
  { email: 'member@demo.studio', firstName: 'Jordan', lastName: 'Reyes', role: UserRole.TEAM_MEMBER },
  { email: 'viewer@demo.studio', firstName: 'Sam', lastName: 'Patel', role: UserRole.VIEWER },
];

const DEMO_AGENTS: { type: AgentType; name: string }[] = [
  { type: AgentType.DIRECTOR, name: 'Director Agent' },
  { type: AgentType.SCRIPT, name: 'Script Agent' },
  { type: AgentType.BUDGET, name: 'Budget Agent' },
  { type: AgentType.SCHEDULE, name: 'Schedule Agent' },
  { type: AgentType.RISK, name: 'Risk Agent' },
  { type: AgentType.MARKETING, name: 'Marketing Agent' },
  { type: AgentType.ANALYTICS, name: 'Analytics Agent' },
];

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-studio' },
    update: {},
    create: { name: 'Demo Studio', slug: 'demo-studio', subscriptionPlan: 'enterprise' },
  });

  const passwordHash = await bcrypt.hash('OrkestraDemo123!', 12);

  let executiveProducer: { id: string } | null = null;

  for (const demo of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: demo.email },
      update: {},
      create: { firstName: demo.firstName, lastName: demo.lastName, email: demo.email, passwordHash },
    });

    await prisma.organizationMember.upsert({
      where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
      update: { role: demo.role },
      create: { userId: user.id, organizationId: org.id, role: demo.role },
    });

    if (demo.role === UserRole.EXECUTIVE_PRODUCER) executiveProducer = user;
  }

  for (const agent of DEMO_AGENTS) {
    await prisma.agent.upsert({
      where: { type: agent.type },
      update: {},
      create: { type: agent.type, name: agent.name },
    });
  }

  if (executiveProducer) {
    await prisma.production.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        organizationId: org.id,
        createdById: executiveProducer.id,
        title: 'The Last Horizon',
        description: 'A feature documentary following three climate scientists across five continents.',
        genre: 'Documentary',
        budget: 1200000,
      },
    });
  }

  console.log('Seed complete. Demo accounts (all use password OrkestraDemo123!):');
  DEMO_USERS.forEach((u) => console.log(`  ${u.role.padEnd(20)} ${u.email}`));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => prisma.$disconnect());
