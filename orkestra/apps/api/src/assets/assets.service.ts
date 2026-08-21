import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_PROVIDER, StorageProvider } from './providers/storage-provider.interface';

const ACCEPTED_MIME = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'image/png',
  'image/jpeg',
  'video/mp4',
]);

const MAX_BYTES = 200 * 1024 * 1024; // 200MB

@Injectable()
export class AssetsService {
  constructor(
    private prisma: PrismaService,
    @Inject(STORAGE_PROVIDER) private storage: StorageProvider,
  ) {}

  async upload(productionId: string, uploadedBy: string, organizationId: string, file: Express.Multer.File) {
    await this.assertProductionInOrg(productionId, organizationId);

    if (!ACCEPTED_MIME.has(file.mimetype)) {
      throw new Error(`Unsupported file type: ${file.mimetype}. Accepted: PDF, DOCX, PNG, JPG, MP4.`);
    }
    if (file.size > MAX_BYTES) {
      throw new Error('File exceeds the 200MB upload limit.');
    }

    const stored = await this.storage.save(file.originalname, file.buffer, file.mimetype);

    return this.prisma.asset.create({
      data: {
        productionId,
        filename: file.originalname,
        fileType: file.mimetype,
        storagePath: stored.storagePath,
        uploadedBy,
      },
    });
  }

  // Previously had no organization check at all — any authenticated user
  // could download any file from any organization just by knowing the
  // asset id.
  async download(id: string, organizationId: string): Promise<{ buffer: Buffer; filename: string; fileType: string }> {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: { production: { select: { organizationId: true } } },
    });
    if (!asset || asset.production.organizationId !== organizationId) {
      throw new NotFoundException('Asset not found.');
    }
    const buffer = await this.storage.read(asset.storagePath);
    return { buffer, filename: asset.filename, fileType: asset.fileType };
  }

  async findByProduction(productionId: string, organizationId: string) {
    await this.assertProductionInOrg(productionId, organizationId);
    return this.prisma.asset.findMany({ where: { productionId }, orderBy: { createdAt: 'desc' } });
  }

  private async assertProductionInOrg(productionId: string, organizationId: string) {
    const production = await this.prisma.production.findUnique({ where: { id: productionId } });
    if (!production || production.organizationId !== organizationId) {
      throw new NotFoundException('Production not found.');
    }
  }
}
