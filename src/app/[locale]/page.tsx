import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { FoundationNoteForm } from "@/components/foundation-note-form";
import { Link } from "@/i18n/navigation";
import { loadEnv } from "@/server/config/env";
import { accountPortalLinks } from "@/server/identity/account-portal";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const env = loadEnv();
  const portal = accountPortalLinks({
    publishableKey: env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    appBaseUrl: env.APP_BASE_URL,
  });

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
      <nav className="flex flex-wrap gap-4 text-sm" aria-label={t("account")}>
        <a href={portal.signInUrl}>{t("signIn")}</a>
        <a href={portal.signUpUrl}>{t("signUp")}</a>
        <a href={portal.userUrl}>{t("account")}</a>
      </nav>
      <FoundationNoteForm />
    </main>
  );
}
