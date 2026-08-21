import { Controller, Get, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('agents')
export class AgentsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.agent.findMany();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prisma.agent.findUnique({ where: { id } });
  }

  @Get(':id/metrics')
  async metrics(@Param('id') id: string) {
    const agent = await this.prisma.agent.findUnique({ where: { id } });
    return {
      agent,
      note: 'Aggregate execution metrics stream to ClickHouse in production; this scaffold returns the latest snapshot from Postgres.',
    };
  }
}
