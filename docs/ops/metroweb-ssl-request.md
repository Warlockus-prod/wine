# MetroWeb — prośba o auto-SSL dla wine.icoffio.com

**Cel:** dodać `wine.icoffio.com` do automatycznego systemu Let's Encrypt MetroWeb, tak
jak pozostałe subdomeny `icoffio.com` (`app`, `n8n`, `regatta`, `web`, `moda`,
`voxcategory`, `geo`, `info`…). Wszystkie one odnawiają się automatycznie (ważne do
2026-07-21), a `wine.icoffio.com` jako jedyna wypadła z tego systemu — certyfikat
wygasł 2026-05-25 i wymaga ręcznego odnawiania (obecnie przez DNS-01 co ~90 dni).

**Konto:** `goleta` / `icoffio.com`
**Panel:** server001.metroweb.pl:2222 (DirectAdmin)

---

## Treść zgłoszenia (do wklejenia w zgłoszeniu / mailu do supportu)

Temat: Prośba o dodanie wine.icoffio.com do automatycznego odnawiania SSL

Dzień dobry,

prosimy o dodanie subdomeny **wine.icoffio.com** (konto `icoffio.com`) do Państwa
systemu automatycznego wydawania i odnawiania certyfikatów Let's Encrypt — tak samo,
jak działa to już dla pozostałych subdomen tej domeny (`app.icoffio.com`,
`n8n.icoffio.com`, `regatta.icoffio.com`, `web.icoffio.com`, `moda.icoffio.com`,
`voxcategory.icoffio.com` itd., których certyfikaty odnawiają się automatycznie).

`wine.icoffio.com` jako jedyna subdomena nie została objęta tym automatem — jej
certyfikat wygasł 25.05.2026 i musieliśmy go odnowić ręcznie metodą DNS-01.
Chcielibyśmy uniknąć powtarzania tej operacji co kwartał.

Kontekst techniczny (gdyby był pomocny): rekord DNS `wine.icoffio.com` (typ A) wskazuje
na Państwa edge `178.104.223.93`, ruch HTTPS na porcie 443 jest przekazywany
(passthrough) na nasz serwer, który serwuje certyfikat. Walidacja HTTP-01 na porcie 80
nie dociera do naszego serwera (edge zwraca 404 dla `/.well-known/acme-challenge/`),
dlatego automatyczne odnawianie po naszej stronie nie działa — stąd prośba o objęcie tej
subdomeny Państwa systemem auto-SSL.

Z góry dziękujemy za pomoc.
Pozdrawiamy,
zespół icoffio

---

## Po pozytywnej odpowiedzi MetroWeb

Gdy MetroWeb potwierdzi objęcie wine.icoffio.com ich auto-SSL:

1. Sprawdzić, czy edge wystawia własny, automatycznie odnawiany certyfikat:
   ```bash
   echo | openssl s_client -connect wine.icoffio.com:443 -servername wine.icoffio.com 2>/dev/null | openssl x509 -noout -issuer -enddate
   ```
2. Jeśli tak — można wyłączyć ręczne odnawianie po naszej stronie i usunąć przypomnienie
   na 2026-08-10 (scheduled task `wine-icoffio-tls-renewal-reminder`). Procedura ręczna w
   CLAUDE.md (sekcja „TLS / cert renewal”) zostaje jako fallback.

## Plan B — self-hosted auto-renew przez DirectAdmin DNS API

Jeśli support MetroWeb odmówi / będzie zwlekać, alternatywa w pełni pod naszą kontrolą:

- Utworzyć w DirectAdmin **Login Key** (Account Manager → Login Keys) z dostępem do
  `CMD_API_DNS_CONTROL`.
- Dodać na VPS skrypt `--manual-auth-hook` / `--manual-cleanup-hook` (lub `acme.sh`
  z wbudowanym `dns_da`), który automatycznie dodaje/usuwa rekord TXT
  `_acme-challenge.wine` przez DA API.
- Wpisać hooki do `/etc/letsencrypt/renewal/wine.icoffio.com.conf` — aktywny
  `certbot.timer` zajmie się resztą automatycznie.

Wada: drugi mechanizm certyfikatów + przechowywany sekret (login key) na współdzielonym
serwerze produkcyjnym. Dlatego preferowany jest wariant z MetroWeb.
