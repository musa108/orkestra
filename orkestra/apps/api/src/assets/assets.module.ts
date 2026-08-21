import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { STORAGE_PROVIDER } from './providers/storage-provider.interface';
import { LocalStorageProvider } from './providers/local.provider';
import { GcsStorageProvider } from './providers/gcs.provider';

const storageFactory = {
  provide: STORAGE_PROVIDER,
  useFactory: () => {
    const useGcs = process.env.STORAGE_PROVIDER === 'gcs' && !!process.env.GCS_BUCKET;
    return useGcs ? new GcsStorageProvider() : new LocalStorageProvider();
  },
};

@Module({
  providers: [storageFactory, AssetsService],
  controllers: [AssetsController],
  exports: [AssetsService],
})
export class AssetsModule {}
