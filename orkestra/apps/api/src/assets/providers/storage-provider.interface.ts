export interface StoredFile {
  storagePath: string;   // opaque path/key the provider understands
  publicUrl?: string;    // signed/public URL if the provider can produce one
}

/**
 * StorageProvider — pluggable boundary between the Asset module and where
 * bytes actually live. LocalStorageProvider (default) writes to disk under
 * apps/api/uploads/, matching the Cloud Storage provider's shape exactly so
 * swapping in GCS later is a one-file change (see gcs.provider.ts).
 */
export interface StorageProvider {
  save(filename: string, buffer: Buffer, mimeType: string): Promise<StoredFile>;
  read(storagePath: string): Promise<Buffer>;
}

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
