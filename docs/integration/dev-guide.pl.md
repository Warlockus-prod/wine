# Integracja „Samouczka smaku" (Vinokompas) ze sklepem — instrukcja dla programistów

**Cel.** Gość sklepu otwiera samouczek, układa swój profil smaku na kompasie,
a system poleca konkretne wina **z Waszego katalogu**, które można od razu
dodać do koszyka — wszystko w tej samej sesji, bez ponownego logowania.

**Model.** Samouczek hostujemy my (jako usługa). Wy osadzacie go przez `iframe`
na **poddomenie Waszej domeny** (`kompas.winnica.pl`). Dzięki temu:
- sesja, ciasteczka i konto klienta sklepu pozostają **nietknięte** (iframe nie ma do nich dostępu),
- macie zawsze najnowszą wersję bez własnego utrzymania,
- klucze AI i logika doboru zostają po naszej stronie.

## Jak to wygląda dla użytkownika
1. Na stronie sklepu przycisk „Dobierz wino / Samouczek smaku".
2. Otwiera się samouczek (osadzony iframe). Użytkownik klika wrażenia na kompasie (skala 0–5).
3. Pod spodem pojawiają się **realne wina z Waszego katalogu** (nazwa, cena, zdjęcie, dostępność).
4. Przycisk „Do koszyka" dodaje wino do **natywnego koszyka sklepu** (w sesji użytkownika).
5. Profil smaku zapisuje się na koncie klienta (jeśli zalogowany).

## Co musicie zrobić (po stronie sklepu)
1. **DNS:** rekord `CNAME kompas.winnica.pl → [nasz host]`.
2. **Osadzenie:** wstawić `iframe` na stronie CMS / w module + krótki skrypt nasłuchujący `postMessage` (auto-wysokość + dodanie do koszyka).
3. **SSO (jeden użytkownik):** wygenerować krótkożyciowy podpisany **token JWT** dla zalogowanego klienta i przekazać go do iframe.
4. **Katalog:** udostępnić endpoint zwracający wina po szczepie/stylu.
5. **Koszyk:** nasłuchiwać `vinokompas:add-to-cart` i dodać produkt do koszyka PrestaShop.
6. **CSP:** zezwolić `frame-src https://kompas.winnica.pl`.

## Snippet osadzenia
```html
<iframe src="https://kompas.winnica.pl/embed/samouczek?lang=pl"
        id="vinokompas" title="Samouczek smaku"
        style="width:100%;border:0" loading="lazy"></iframe>
<script>
const VK_ORIGIN = "https://kompas.winnica.pl";
addEventListener("message", (e) => {
  if (e.origin !== VK_ORIGIN) return;                 // KONIECZNA weryfikacja origin
  const m = e.data || {};
  if (m.source !== "vinokompas") return;
  if (m.type === "vinokompas:resize")
    document.getElementById("vinokompas").style.height = m.height + "px";
  if (m.type === "vinokompas:add-to-cart")
    addToCart(m.id_product, m.qty || 1);              // Wasza funkcja koszyka
});
// po załadowaniu iframe — przekazać zalogowanego klienta:
document.getElementById("vinokompas").addEventListener("load", () => {
  document.getElementById("vinokompas").contentWindow.postMessage(
    { type: "vinokompas:set-user", token: VK_TOKEN }, VK_ORIGIN);
});
</script>
```

## Kontrakt postMessage
- **iframe → strona:** `vinokompas:ready`, `vinokompas:resize {height}`, `vinokompas:add-to-cart {id_product, qty}`, `vinokompas:go-to-product {url}`
- **strona → iframe:** `vinokompas:set-user {token}`, `vinokompas:locale {lang}`

Każda wiadomość ma `source: "vinokompas"`. Zawsze sprawdzajcie `event.origin`.

## Token SSO (JWT)
Claims: `{ sub: id_klienta, email, locale, cart_id, iat, exp }`
Podpis **HS256** wspólnym sekretem (tylko server-side). Ważność **10–15 min**.

## Endpoint katalogu (po stronie sklepu)
```
GET /api/vinokompas/products?grape=Riesling&style=white&limit=6
→ [{ id_product, name, grape, style, region, price, currency, image, url, in_stock }]
```
Opcjonalnie: oznaczcie wina atrybutami (grape/style/region/słodycz) w features
PrestaShop — wtedy dobór jest celniejszy.

## Bezpieczeństwo
- Token krótkożyciowy i podpisany; sekret nigdy po stronie klienta.
- Zawsze weryfikujcie `event.origin` przy odbiorze postMessage.
- Tylko HTTPS.
- Koszyk i sesja pozostają w 100% po stronie sklepu — iframe ich nie dotyka.

## Fazy wdrożenia
1. **MVP:** iframe + klik w wino otwiera realną stronę produktu winnica.pl w tym samym oknie. (token nie jest potrzebny)
2. **+ realny katalog:** endpoint katalogu → realne wina z ceną/dostępnością w samouczku.
3. **+ koszyk w iframe:** `add-to-cart` przez postMessage.
4. **+ SSO/konto:** token → profil smaku zapisany na koncie, personalizacja.
