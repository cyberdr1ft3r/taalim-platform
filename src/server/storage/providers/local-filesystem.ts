import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { createOpaqueStorageKey, isOpaqueStorageKey } from "../keys";
import type { ObjectMetadata, PutObjectInput, StorageProvider, StoredObject } from "../types";

const TOKEN_PREFIX = "taalim-local";
const MAX_TEMPORARY_ACCESS_SECONDS = 300;

export class LocalFilesystemStorageProvider implements StorageProvider {
  private readonly rootDirectory: string;
  private readonly accessSecret: string;

  constructor(options: { rootDirectory: string; accessSecret: string }) {
    this.rootDirectory = path.resolve(options.rootDirectory);
    this.accessSecret = options.accessSecret;
    assertPrivateRoot(this.rootDirectory);
  }

  async put(input: PutObjectInput): Promise<StoredObject> {
    const key = createOpaqueStorageKey();
    const body = await readBody(input.body);
    const record: ObjectMetadata = {
      key,
      contentType: sanitizeContentType(input.contentType),
      byteSize: body.byteLength,
      createdAt: new Date().toISOString(),
    };
    await mkdir(this.objectDirectory(key), { recursive: true });
    await mkdir(this.metadataDirectory(key), { recursive: true });
    await writeFile(this.objectPath(key), body);
    await writeFile(this.metadataPath(key), JSON.stringify(record));
    return record;
  }

  async get(key: string): Promise<ReadableStream<Uint8Array>> {
    const record = await this.metadata(key);
    if (!record) throw new Error("Stored object not found");
    const bytes = await readFile(this.objectPath(key));
    return Readable.toWeb(Readable.from([bytes])) as ReadableStream<Uint8Array>;
  }

  async delete(key: string): Promise<void> {
    assertKey(key);
    await rm(this.objectPath(key), { force: true });
    await rm(this.metadataPath(key), { force: true });
  }

  async exists(key: string): Promise<boolean> {
    return (await this.metadata(key)) !== null;
  }

  async metadata(key: string): Promise<ObjectMetadata | null> {
    if (!isOpaqueStorageKey(key)) return null;
    try {
      const raw = await readFile(this.metadataPath(key), "utf8");
      const parsed = JSON.parse(raw) as ObjectMetadata;
      if (parsed.key !== key) return null;
      return parsed;
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  }

  async createTemporaryAccess(key: string, expiresInSeconds: number): Promise<string> {
    if (!isOpaqueStorageKey(key)) throw new Error("Invalid storage key");
    if (!(await this.exists(key))) throw new Error("Stored object not found");
    const lifetime = Math.min(Math.max(1, Math.floor(expiresInSeconds)), MAX_TEMPORARY_ACCESS_SECONDS);
    const payload = Buffer.from(
      JSON.stringify({ key, exp: Math.floor(Date.now() / 1000) + lifetime }),
    ).toString("base64url");
    const signature = sign(payload, this.accessSecret);
    return `${TOKEN_PREFIX}.${payload}.${signature}`;
  }

  private objectDirectory(key: string): string {
    assertKey(key);
    return contained(this.rootDirectory, path.join(this.rootDirectory, "objects"));
  }

  private metadataDirectory(key: string): string {
    assertKey(key);
    return contained(this.rootDirectory, path.join(this.rootDirectory, "metadata"));
  }

  private objectPath(key: string): string {
    assertKey(key);
    return contained(this.rootDirectory, path.join(this.rootDirectory, "objects", key));
  }

  private metadataPath(key: string): string {
    assertKey(key);
    return contained(this.rootDirectory, path.join(this.rootDirectory, "metadata", `${key}.json`));
  }
}

export function verifyLocalTemporaryAccess(
  token: string,
  secret: string,
): { key: string; exp: number } | null {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== TOKEN_PREFIX) return null;
  const payload = parts[1] ?? "";
  const signature = parts[2] ?? "";
  const expected = sign(payload, secret);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      key?: string;
      exp?: number;
    };
    if (!parsed.key || !isOpaqueStorageKey(parsed.key) || typeof parsed.exp !== "number") return null;
    if (parsed.exp <= Math.floor(Date.now() / 1000)) return null;
    return { key: parsed.key, exp: parsed.exp };
  } catch {
    return null;
  }
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function assertKey(key: string): void {
  if (!isOpaqueStorageKey(key)) throw new Error("Invalid storage key");
}

function assertPrivateRoot(rootDirectory: string): void {
  const publicDirectory = path.resolve(process.cwd(), "public");
  if (rootDirectory === publicDirectory || rootDirectory.startsWith(`${publicDirectory}${path.sep}`)) {
    throw new Error("Local storage root must not live inside public/");
  }
}

function contained(root: string, candidate: string): string {
  const resolved = path.resolve(candidate);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error("Storage path escaped the private root");
  }
  return resolved;
}

function sanitizeContentType(contentType: string): string {
  return /^[\w.+-]+\/[\w.+-]+$/.test(contentType) ? contentType : "application/octet-stream";
}

async function readBody(body: Uint8Array | ReadableStream<Uint8Array>): Promise<Uint8Array> {
  if (body instanceof Uint8Array) return body;
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const step = await reader.read();
    if (step.done) break;
    if (step.value) {
      chunks.push(step.value);
      total += step.value.byteLength;
    }
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}

function isNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
