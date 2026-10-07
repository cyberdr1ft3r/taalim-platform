"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { foundationNoteSchema, type FoundationNote } from "@/components/foundation-note-schema";
import { zodResolver } from "@/lib/zod-resolver";

export function FoundationNoteForm() {
  const t = useTranslations("home");
  const [accepted, setAccepted] = useState(false);
  const form = useForm<FoundationNote>({
    resolver: zodResolver(foundationNoteSchema),
    defaultValues: { note: "" },
  });

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={form.handleSubmit(() => {
        setAccepted(true);
      })}
      noValidate
    >
      <label className="flex flex-col gap-2 text-sm" htmlFor="foundation-note">
        {t("formLabel")}
        <input
          id="foundation-note"
          className="rounded-md border border-input bg-background px-3 py-2"
          {...form.register("note")}
        />
      </label>
      {form.formState.errors.note ? (
        <p role="alert" className="text-sm">
          {t("formError")}
        </p>
      ) : null}
      {accepted ? <p role="status">{t("formSuccess")}</p> : null}
      <Button type="submit">{t("formSubmit")}</Button>
    </form>
  );
}
