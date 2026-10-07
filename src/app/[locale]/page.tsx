import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { FoundationNoteForm } from "@/components/foundation-note-form";
import { Link } from "@/i18n/navigation";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-16">
      <p className="text-sm text-muted-foreground">{t("eyebrow")}</p>
      <h1 className="text-3xl font-semibold">{t("title")}</h1>
      <p>{t("summary")}</p>
      <nav className="flex gap-4 text-sm">
        <Link href="/" locale="ar">
          {t("switchToArabic")}
        </Link>
        <Link href="/" locale="fr">
          {t("switchToFrench")}
        </Link>
      </nav>
      <FoundationNoteForm />
    </main>
  );
}
