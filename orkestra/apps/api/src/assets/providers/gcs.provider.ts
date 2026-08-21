import { Injectable, Logger } from '@nestjs/common';
import { StorageProvider, StoredFile } from './storage-provider.interface';

/**
 * Google Cloud Storage adapter — inactive unless STORAGE_PROVIDER=gcs and
 * GCS_BUCKET is set. Requires the optional "@google-cloud/storage" package
 * (not installed by default, to keep the scaffold's dependency footprint
 * small); install it before switching STORAGE_PROVIDER=gcs.
 */
@Injectable()
export class GcsStorageProvider implements StorageProvider {
  private readonly logger = new Logger('GcsStorageProvider');

  async save(filename: string, buffer: Buffer, mimeType: string): Promise<StoredFile> {
    const bucket = process.env.GCS_BUCKET;
    if (!bucket) {
      throw new Error('GcsStorageProvider selected but GCS_BUCKET is not set.');
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Storage } = require('@google-cloud/storage');
    const storage = new Storage();
    const key = `${Date.now()}-${filename}`;
    const file = storage.bucket(bucket).file(key);
    await file.save(buffer, { contentType: mimeType });
    const [url] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 3600_000 });
    return { storagePath: key, publicUrl: url };
  }

  async read(storagePath: string): Promise<Buffer> {
    const bucket = process.env.GCS_BUCKET;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Storage } = require('@google-cloud/storage');
    const storage = new Storage();
    const [buf] = await storage.bucket(bucket).file(storagePath).download();
    return buf;
  }
}
