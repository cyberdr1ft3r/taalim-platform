import type { FieldErrors, Resolver } from "react-hook-form";
import type { ZodType } from "zod";

export function zodResolver<T extends Record<string, unknown>>(schema: ZodType<T>): Resolver<T> {
  return async (values) => {
    const result = schema.safeParse(values);
    if (result.success) {
      return { values: result.data, errors: {} };
    }
    const errors: Record<string, { type: string; message: string }> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !errors[key]) {
        errors[key] = { type: issue.code, message: issue.message };
      }
    }
    return { values: {} as never, errors: errors as FieldErrors<T> };
  };
}
