# Data review — 2026-07 (agents: curated-mismatch · PL vetting · winnica scout)

## 1. Curated pairing reasons — итог проверки (50 dishes / 100 reasons, en+pl)
**Класс «reason описывает чужое блюдо» не обнаружен** — все 100 обоснований соответствуют
своим блюдам и винам. Реальные проблемы были УРОВНЯ ЗАВЕДЕНИЯ и исправлены в этом же коммите:
- **bottiglieria-1881**: бренд «Osteria Francescana» (итальянский) при 100% испанском
  tapas-меню и испанской карте → ребрендинг **Bodega 1881** (Kraków, Spanish).
- **senses-warsaw**: бренд «Sukiyabashi Jiro» (омакасэ суши-я, Tokyo) при меню с рамэном,
  якитори и чизкейком → ребрендинг **Izakaya Senses** (Warszawa) — слаг снова честен.
- Остались 8 low (сухие вина к десертам и т.п.) — вкусовые решения, на вычитку сомелье.

## 2. PL-вычитка (~200 гостевых строк)
Вердикт агента-редактора: «не pitch-ready, но в одном редакторском дне от готовности».
**11 high исправлены в этом коммите** (masło orzechowe→masło palone, tanniczna→taninowa,
pluszowość→aksamitna miękkość, zaciężyć, wytrwałe bąbelki→trwały perlaż, obramowują→dopełniają,
red blend→kupaż, bark→łopatka, zapiekanka z gruyère, + все «wykończenie»→«finisz»).
**Остаётся ~40 medium** (системно: „wytrawny" как перевод *savory*; „mus" вместо perlage;
кальки „resetuje podniebienie", „podnosi tłuszcz", „niesie kaczkę"; несклонённое „Champagne";
„lemon curd", „mocha" по-английски) + финальная вычитка носителем-сомелье, как и было
записано в CLAUDE.md. Полный список — в выводе агента `data:pl-vetting`
(workflow wf_deec1234, tasks/weelksbzc.output).

## 3. winnica.pl — план парсера (разведка: 11 запросов)
PrestaShop 1.7, полностью SSR, robots.txt открыт (без Disallow), sitemap нет.
- **Каталог**: `https://winnica.pl/pl/12-wina` — 577 вин, 48/стр, пагинация `?page=1..13`.
  URL продукта: `/pl/{producer}/{id}-{slug}.html`.
- **Карточка**: `<h1>` имя; `itemprop="price" content` (PLN); `og:image`
  (`…-home_default/… → large_default` для hi-res); `div.product-description`.
- **🔑 Главное**: `<dl class="data-sheet">` каждого вина несёт Kolor/Smak/Kraj/Region/
  Szczep/alkohol/Vivino **и 12 осей аромата 0–5, маппящихся 1:1 на наши TendencjaIds**
  («Tytoń, kawa, czekolada»→tegie.cigaro, «Suszone owoce»→tegie.suszone, «Dojrzałe owoce»→
  miekkie.dojrzale, «Konfitury, wanilia»→miekkie.konfitury, «Masło, orzechy»→oleiste.maslo,
  «Tropikalne owoce»→oleiste.tropikalne, «Warzywa, zielone owoce»→swieze.zielone,
  «Cytrusy, kwaśne owoce»→swieze.cytrusy, «Minerały»→ziemiste.mineraly, «Ściółka leśna,
  fiołki»→ziemiste.sciolka, «Piżmo, skóra»→szorstkie.pizmo, «Dąb, dym, garbniki»→szorstkie.dab).
  Т.е. winnica (авторы Vinokompas) публикуют ГОТОВЫЙ compass-fingerprint — синтез не нужен.
- **Стиль**: Kolor + Smak + флаг «Musujące: Tak» из data-sheet (не по категории).
- **План на 50+ вин**: 13 листингов → выбрать ~60 сбалансированно по стилям/ценам →
  60 карточек (throttle ≤1 rps, ~75 запросов) → генерируем `samouczek-wines.ts` с реальными
  name/price/photo/fingerprint + ПРЯМОЙ ссылкой на карточку (вместо поисковой).
- Caveats: нет JSON-LD → парсер связан с темой (добавить canary-проверку имён полей
  data-sheet); цены = снапшот; атрибуцию winnica.pl на карточках сохраняем.
