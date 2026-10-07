import { z } from "zod";

export const foundationNoteSchema = z.object({
  note: z.string().trim().min(1).max(120),
});

export type FoundationNote = z.infer<typeof foundationNoteSchema>;
