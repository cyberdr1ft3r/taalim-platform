import { z } from "zod";

export interface ClaimedJob {
  id: string;
  type: string;
  payload: unknown;
  attempts: number;
  maxAttempts: number;
}

export interface JobHandler {
  schema: z.ZodType;
  handle: (payload: unknown) => Promise<void>;
}

export const jobHandlers: Record<string, JobHandler> = {
  "foundation.ping": {
    schema: z.object({ nonce: z.string().min(1).max(64) }),
    handle: async () => undefined,
  },
};

export type JobOutcome = "succeeded" | "failed" | "retry";

export async function runClaimedJob(
  job: ClaimedJob,
  handlers: Record<string, JobHandler> = jobHandlers,
): Promise<JobOutcome> {
  const handler = handlers[job.type];
  if (!handler) return "failed";
  const parsed = handler.schema.safeParse(job.payload);
  if (!parsed.success) return "failed";
  try {
    await handler.handle(parsed.data);
    return "succeeded";
  } catch {
    return job.attempts >= job.maxAttempts ? "failed" : "retry";
  }
}
