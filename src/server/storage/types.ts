export interface PutObjectInput {
  body: Uint8Array | ReadableStream<Uint8Array>;
  contentType: string;
}

export interface StoredObject {
  key: string;
  contentType: string;
  byteSize: number;
  createdAt: string;
}

export interface ObjectMetadata {
  key: string;
  contentType: string;
  byteSize: number;
  createdAt: string;
}

export interface StorageProvider {
  put(input: PutObjectInput): Promise<StoredObject>;
  get(key: string): Promise<ReadableStream<Uint8Array>>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  metadata(key: string): Promise<ObjectMetadata | null>;
  createTemporaryAccess?(key: string, expiresInSeconds: number): Promise<string>;
}
