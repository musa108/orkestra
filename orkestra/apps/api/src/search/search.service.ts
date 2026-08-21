import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type SearchType = 'production' | 'task' | 'user' | 'all';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(organizationId: string, q: string, type: SearchType = 'all') {
    const term = q?.trim();
    if (!term) return { productions: [], tasks: [], users: [] };

    const [productions, tasks, users] = await Promise.all([
      type === 'all' || type === 'production'
        ? this.prisma.production.findMany({
            where: { organizationId, title: { contains: term, mode: 'insensitive' } },
            take: 10,
          })
        : [],
      type === 'all' || type === 'task'
        ? this.prisma.task.findMany({
            where: { title: { contains: term, mode: 'insensitive' }, production: { organizationId } },
            take: 10,
          })
        : [],
      type === 'all' || type === 'user'
        ? this.prisma.user.findMany({
            where: {
              memberships: { some: { organizationId } },
              deletedAt: null,
              OR: [
                { firstName: { contains: term, mode: 'insensitive' } },
                { lastName: { contains: term, mode: 'insensitive' } },
                { email: { contains: term, mode: 'insensitive' } },
              ],
            },
            select: { id: true, firstName: true, lastName: true, email: true },
            take: 10,
          })
        : [],
    ]);

    return { productions, tasks, users };
  }
}
