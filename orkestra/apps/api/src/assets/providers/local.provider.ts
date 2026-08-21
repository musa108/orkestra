import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { StorageProvider, StoredFile } from './storage-provider.interface';

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  async save(filename: string, buffer: Buffer, _mimeType: string): Promise<StoredFile> {
    await fs.mkdir(UPLOAD_ROOT, { recursive: true });
    const key = `${randomUUID()}-${filename.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    await fs.writeFile(path.join(UPLOAD_ROOT, key), buffer);
    return { storagePath: key };
  }

  async read(storagePath: string): Promise<Buffer> {
    return fs.readFile(path.join(UPLOAD_ROOT, storagePath));
  }
}
