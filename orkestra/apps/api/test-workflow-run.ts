import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { WorkflowEngineService } from './src/workflow/workflow-engine.service';
import { PrismaService } from './src/prisma/prisma.service';

async function testWorkflow() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const engine = app.get(WorkflowEngineService);
  const prisma = app.get(PrismaService);

  const production = await prisma.production.findFirst({
    include: { organization: true, createdBy: true },
  });

  if (!production) {
    console.error('No production found in database. Run seed first.');
    await app.close();
    return;
  }

  console.log(`Starting workflow for production: ${production.title} (${production.id})`);

  try {
    const wf = await engine.start(
      production.id,
      'Test brief',
      production.createdById,
      production.organizationId,
    );
    console.log('Started workflow:', wf.id, 'State:', wf.currentState);

    // Wait 3 seconds for async step execution graph to process
    await new Promise((r) => setTimeout(r, 3000));

    const finalWf = await engine.getWithSteps(wf.id, production.organizationId);
    console.log('Final workflow state:', finalWf.currentState);
    console.log('Steps:');
    finalWf.steps.forEach((s) => console.log(`  - ${s.name.padEnd(25)} status=${s.status}`));

    const events = await engine.history(wf.id, production.organizationId);
    console.log('Events History:');
    events.forEach((e) => console.log(`  [${e.eventType}] payload:`, JSON.stringify(e.payload)));

  } catch (err: any) {
    console.error('Workflow engine error:', err);
  } finally {
    await app.close();
  }
}

testWorkflow();
