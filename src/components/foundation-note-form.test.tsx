// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import ar from "../../messages/ar.json";
import { FoundationNoteForm } from "./foundation-note-form";

describe("FoundationNoteForm", () => {
  it("rejects an empty note and accepts a synthetic one", async () => {
    render(
      <NextIntlClientProvider locale="ar" messages={ar}>
        <FoundationNoteForm />
      </NextIntlClientProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: ar.home.formSubmit }));
    expect(await screen.findByRole("alert")).toHaveTextContent(ar.home.formError);
    fireEvent.change(screen.getByLabelText(ar.home.formLabel), { target: { value: "ملاحظة" } });
    fireEvent.click(screen.getByRole("button", { name: ar.home.formSubmit }));
    expect(await screen.findByRole("status")).toHaveTextContent(ar.home.formSuccess);
  });
});
