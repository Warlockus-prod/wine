import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import Navigation from "@/components/v2/Navigation";
import MobileTabBar from "@/components/v2/MobileTabBar";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://wine.icoffio.com";
const CONTACT_EMAIL = "hello@icoffio.com";
const LAST_UPDATED = "2026-07-17";

// Long-form legal copy lives inline (PL primary, EN mirror) - same pattern as
// /samouczek metadata: this content doesn't belong in messages/*.json.

const META: Record<"en" | "pl", { title: string; description: string }> = {
  en: {
    title: "Privacy Policy | Vinovigator AI",
    description:
      "What Vinovigator AI stores and why: an anonymous taste profile, nameless analytics events, and chat messages processed via the OpenAI API. No accounts, no tracking cookies.",
  },
  pl: {
    title: "Polityka prywatności | Vinovigator AI",
    description:
      "Co przechowuje Vinovigator AI i po co: anonimowy profil smaku, bezimienne zdarzenia analityczne oraz wiadomości czatu przetwarzane przez API OpenAI. Bez kont i bez śledzących cookies.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = META[locale === "pl" ? "pl" : "en"];
  const url = `${SITE_URL}/${locale === "en" ? "" : `${locale}/`}privacy`;

  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: url,
      languages: { en: `${SITE_URL}/privacy`, pl: `${SITE_URL}/pl/privacy` },
    },
    openGraph: {
      type: "website",
      title: m.title,
      description: m.description,
      url,
      siteName: "Vinovigator AI",
      locale: locale === "pl" ? "pl_PL" : "en_US",
    },
  };
}

type Section = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

type PageCopy = {
  eyebrow: string;
  heading: string;
  intro: string;
  updated: string;
  sections: Section[];
  contactTitle: string;
  contactBody: string;
  contactCta: string;
};

const COPY: Record<"en" | "pl", PageCopy> = {
  pl: {
    eyebrow: "Vinovigator AI",
    heading: "Polityka prywatności",
    intro:
      "Vinovigator AI działa bez kont, bez rejestracji i bez śledzących cookies. Poniżej uczciwie opisujemy, jakie dane powstają podczas korzystania z serwisu, gdzie trafiają i jak się ich pozbyć.",
    updated: `Ostatnia aktualizacja: ${LAST_UPDATED}`,
    sections: [
      {
        title: "Kto odpowiada za serwis",
        paragraphs: [
          "Administratorem danych jest operator serwisu wine.icoffio.com. We wszystkich sprawach dotyczących prywatności możesz napisać na adres podany na dole tej strony.",
        ],
      },
      {
        title: "Jakie dane przechowujemy",
        paragraphs: [
          "Serwis nie zbiera imion, nazwisk, adresów e-mail ani danych płatniczych odwiedzających. Powstają wyłącznie następujące dane:",
        ],
        bullets: [
          "Anonimowy profil smaku - ustawienia Twojego Winokompasu zapisują się w pamięci przeglądarki (localStorage). Opcjonalnie profil jest synchronizowany do naszej bazy danych pod losowym identyfikatorem (UUID) wygenerowanym w Twojej przeglądarce - bez powiązania z imieniem czy adresem e-mail.",
          "Zdarzenia analityczne - które strony, dania i wina były oglądane lub wybierane oraz interakcje z kompasem. Zdarzenia nie zawierają imion ani adresów e-mail; co najwyżej ten sam anonimowy identyfikator.",
          "Wiadomości czatu - pytania do przewodnika winiarskiego i prośby o wyjaśnienie połączeń są przekazywane do API OpenAI w celu wygenerowania odpowiedzi. Nie wpisuj w czacie danych osobowych.",
        ],
      },
      {
        title: "Adres IP i limity zapytań",
        paragraphs: [
          "Adres IP wykorzystujemy wyłącznie przejściowo - do ograniczania liczby zapytań do API (ochrona przed nadużyciami). Nie zapisujemy adresu IP razem ze zdarzeniami analitycznymi ani profilem smaku.",
        ],
      },
      {
        title: "Cookies i pamięć przeglądarki",
        paragraphs: [
          "Jedyne cookie serwisu to NEXT_LOCALE - zapamiętuje wybrany język (polski lub angielski). Nie używamy cookies reklamowych ani śledzących. Profil smaku i drobne preferencje interfejsu trzymamy w localStorage Twojej przeglądarki - możesz je w każdej chwili usunąć, czyszcząc dane witryny.",
        ],
      },
      {
        title: "Zewnętrzni dostawcy",
        paragraphs: [
          "Korzystamy z dwóch zewnętrznych usług, którym przekazywane są dane wyłącznie w zakresie technicznie niezbędnym:",
        ],
        bullets: [
          "OpenAI (API) - przetwarza treść wiadomości czatu i opisy par danie-wino, aby wygenerować odpowiedź. Przekazywana jest treść rozmowy, nie Twoja tożsamość.",
          "Mapbox - mapa restauracji na stronie głównej pobiera kafelki z serwerów Mapbox; Twoja przeglądarka łączy się z nimi bezpośrednio (Mapbox widzi wtedy Twój adres IP, zgodnie ze swoją polityką prywatności).",
        ],
      },
      {
        title: "Jak długo trzymamy dane",
        paragraphs: [
          "Zdarzenia analityczne przechowujemy w formie dziennika na potrzeby rozwoju produktu. Anonimowy profil smaku przechowujemy, dopóki nie poprosisz o jego usunięcie albo nie nadpiszesz go nowym.",
        ],
      },
      {
        title: "Twoje prawa (RODO)",
        paragraphs: [
          "Masz prawo dostępu do danych, ich sprostowania i usunięcia. Ponieważ dane są anonimowe, do realizacji prośby potrzebujemy Twojego anonimowego identyfikatora - znajdziesz go w localStorage przeglądarki (klucz z profilem kompasu). Dane zapisane wyłącznie w przeglądarce usuniesz samodzielnie, czyszcząc dane witryny.",
        ],
      },
      {
        title: "Zmiany tej polityki",
        paragraphs: [
          "Jeśli zakres przetwarzanych danych się zmieni, zaktualizujemy tę stronę i datę na jej górze. Istotne zmiany zasygnalizujemy w serwisie.",
        ],
      },
    ],
    contactTitle: "Kontakt",
    contactBody:
      "Pytania o prywatność, prośby o dostęp lub usunięcie danych - napisz do operatora serwisu.",
    contactCta: "Napisz do nas",
  },
  en: {
    eyebrow: "Vinovigator AI",
    heading: "Privacy Policy",
    intro:
      "Vinovigator AI runs without accounts, without registration and without tracking cookies. Below is an honest description of what data comes into existence when you use the site, where it goes, and how to get rid of it.",
    updated: `Last updated: ${LAST_UPDATED}`,
    sections: [
      {
        title: "Who operates this site",
        paragraphs: [
          "The data controller is the operator of wine.icoffio.com. For any privacy matter, use the contact address at the bottom of this page.",
        ],
      },
      {
        title: "What we store",
        paragraphs: [
          "The site collects no visitor names, e-mail addresses or payment data. Only the following data is created:",
        ],
        bullets: [
          "An anonymous taste profile - your Wine Compass settings are saved in your browser's localStorage. Optionally the profile is synced to our database under a random identifier (UUID) generated in your browser - never linked to a name or e-mail address.",
          "Analytics events - which pages, dishes and wines were viewed or selected, plus compass interactions. Events carry no names or e-mails; at most the same anonymous identifier.",
          "Chat messages - questions to the wine guide and pairing-explanation requests are sent to the OpenAI API to generate a reply. Please don't type personal data into the chat.",
        ],
      },
      {
        title: "IP addresses and rate limiting",
        paragraphs: [
          "Your IP address is used transiently only - to rate-limit API requests (abuse protection). We do not store IP addresses alongside analytics events or taste profiles.",
        ],
      },
      {
        title: "Cookies and browser storage",
        paragraphs: [
          "The only cookie this site sets is NEXT_LOCALE - it remembers your language choice (Polish or English). There are no advertising or tracking cookies. Your taste profile and small interface preferences live in your browser's localStorage - clear the site data at any time to remove them.",
        ],
      },
      {
        title: "Third-party services",
        paragraphs: [
          "We rely on two external services, each receiving only what is technically necessary:",
        ],
        bullets: [
          "OpenAI (API) - processes the content of chat messages and dish-wine pair descriptions to generate replies. The conversation text is transmitted, not your identity.",
          "Mapbox - the restaurant map on the homepage loads tiles from Mapbox servers; your browser connects to them directly (Mapbox then sees your IP address, subject to its own privacy policy).",
        ],
      },
      {
        title: "How long we keep data",
        paragraphs: [
          "Analytics events are kept as a log for product development. The anonymous taste profile is kept until you ask us to delete it or overwrite it with a new one.",
        ],
      },
      {
        title: "Your rights (GDPR)",
        paragraphs: [
          "You have the right to access, rectify and erase your data. Because the data is anonymous, we need your anonymous identifier to act on a request - you'll find it in your browser's localStorage (the compass profile key). Data stored only in your browser can be removed yourself by clearing the site data.",
        ],
      },
      {
        title: "Changes to this policy",
        paragraphs: [
          "If the scope of processing changes, we will update this page and the date at its top. Significant changes will be signposted in the app.",
        ],
      },
    ],
    contactTitle: "Contact",
    contactBody:
      "Privacy questions, access or deletion requests - write to the site operator.",
    contactCta: "Write to us",
  },
};

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const copy = COPY[locale === "pl" ? "pl" : "en"];

  return (
    <div className="pitch-grain mobile-safe-bottom min-h-screen bg-background-dark text-[color:var(--ink)]">
      <Navigation />

      <main className="mx-auto w-full max-w-5xl px-4 pt-24 pb-24 sm:px-6 lg:px-8">
        {/* ───────── HERO ───────── */}
        <section
          aria-labelledby="privacy-title"
          className="editorial-hero relative overflow-hidden rounded-[36px] border border-white/8 bg-[radial-gradient(circle_at_10%_20%,rgba(199,159,105,0.18),transparent_45%),radial-gradient(circle_at_90%_85%,rgba(199,159,105,0.18),transparent_45%),linear-gradient(180deg,#122a52_0%,#081634_100%)] px-5 py-12 sm:px-10 sm:py-16"
        >
          <span className="pitch-eyebrow pitch-eyebrow--start">{copy.eyebrow}</span>
          <h1
            id="privacy-title"
            className="pitch-display mt-6 text-[clamp(2rem,5.5vw,3.6rem)] text-white"
          >
            {copy.heading}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-[1.7] text-[color:var(--ink-soft)] sm:text-lg">
            {copy.intro}
          </p>
          <p className="mt-4 text-sm text-[color:var(--ink-soft)]">{copy.updated}</p>
        </section>

        <div className="my-10 flex items-center justify-center sm:my-16" aria-hidden>
          <span className="pitch-ornament">· · ·</span>
        </div>

        {/* ───────── SECTIONS ───────── */}
        <ol className="space-y-4">
          {copy.sections.map((section, i) => (
            <li
              key={section.title}
              className="grid gap-4 rounded-3xl border border-white/8 bg-[#081634] p-5 transition-colors duration-500 hover:border-[rgba(199,159,105,0.32)] sm:p-7 lg:grid-cols-[7rem_minmax(0,1fr)] lg:items-start lg:gap-10"
            >
              <span className="pitch-display text-4xl text-[var(--color-accent-gold)] sm:text-5xl">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="pitch-display text-xl text-white sm:text-2xl">{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 40)}
                    className="mt-2 text-sm leading-relaxed text-[color:var(--ink-soft)] sm:text-base"
                  >
                    {paragraph}
                  </p>
                ))}
                {section.bullets ? (
                  <ul className="mt-3 space-y-2">
                    {section.bullets.map((bullet) => (
                      <li
                        key={bullet.slice(0, 40)}
                        className="flex gap-3 text-sm leading-relaxed text-[color:var(--ink-soft)] sm:text-base"
                      >
                        <span aria-hidden className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent-gold)]" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </li>
          ))}
        </ol>

        <div className="my-10 flex items-center justify-center sm:my-16" aria-hidden>
          <span className="pitch-ornament">· · ·</span>
        </div>

        {/* ───────── CONTACT ───────── */}
        <section
          aria-labelledby="privacy-contact"
          className="editorial-hero editorial-hero--center relative overflow-hidden rounded-[36px] border border-[rgba(199,159,105,0.32)] bg-[radial-gradient(circle_at_50%_120%,rgba(199,159,105,0.32),transparent_60%),linear-gradient(180deg,#122a52,#081634)] px-5 py-12 text-center sm:px-10 sm:py-16"
        >
          <h2
            id="privacy-contact"
            className="pitch-display mx-auto max-w-3xl text-[clamp(1.6rem,4.5vw,2.8rem)] text-white"
          >
            {copy.contactTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[color:var(--ink-soft)]">
            {copy.contactBody}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href={`mailto:${CONTACT_EMAIL}`} className="pitch-cta-primary">
              {copy.contactCta}
            </a>
          </div>
          <p className="mt-4 text-sm text-[color:var(--ink-soft)]">{CONTACT_EMAIL}</p>
        </section>
      </main>

      <MobileTabBar />
    </div>
  );
}
