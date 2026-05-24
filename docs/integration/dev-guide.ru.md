# Интеграция «Самоучителя вкуса» (Vinokompas) в магазин — инструкция для разработчиков

**Цель.** Гость магазина открывает самоучитель, собирает профиль вкуса на
компасе, система рекомендует конкретные вина **из вашего каталога**, которые
можно сразу добавить в корзину — всё в одной сессии, без повторного логина.

**Модель.** Самоучитель хостим мы (как сервис). Вы встраиваете его через
`iframe` на **поддомене вашего домена** (`kompas.winnica.pl`). За счёт этого:
- сессия, кукис и аккаунт клиента магазина **не затрагиваются** (iframe к ним не имеет доступа),
- у вас всегда свежая версия без собственной поддержки,
- ключи AI и логика подбора остаются на нашей стороне.

## Как это выглядит для пользователя
1. На странице магазина кнопка «Подобрать вино / Самоучитель вкуса».
2. Открывается самоучитель (встроенный iframe). Пользователь кликает впечатления на компасе (шкала 0–5).
3. Ниже появляются **реальные вина из вашего каталога** (название, цена, фото, наличие).
4. Кнопка «В корзину» добавляет вино в **нативную корзину магазина** (в сессии пользователя).
5. Профиль вкуса сохраняется в кабинете клиента (если залогинен).

## Что нужно сделать (на стороне магазина)
1. **DNS:** запись `CNAME kompas.winnica.pl → [наш хост]`.
2. **Встраивание:** вставить `iframe` на CMS-странице / в модуле + короткий скрипт-слушатель `postMessage` (авто-высота + добавление в корзину).
3. **SSO (один пользователь):** сгенерировать короткоживущий подписанный **JWT** для залогиненного клиента и передать в iframe.
4. **Каталог:** отдать endpoint, возвращающий вина по сорту/стилю.
5. **Корзина:** слушать `vinokompas:add-to-cart` и добавлять товар в корзину PrestaShop.
6. **CSP:** разрешить `frame-src https://kompas.winnica.pl`.

## Сниппет встраивания
```html
<iframe src="https://kompas.winnica.pl/embed/samouczek?lang=pl"
        id="vinokompas" title="Samouczek smaku"
        style="width:100%;border:0" loading="lazy"></iframe>
<script>
const VK_ORIGIN = "https://kompas.winnica.pl";
addEventListener("message", (e) => {
  if (e.origin !== VK_ORIGIN) return;                 // ОБЯЗАТЕЛЬНАЯ проверка origin
  const m = e.data || {};
  if (m.source !== "vinokompas") return;
  if (m.type === "vinokompas:resize")
    document.getElementById("vinokompas").style.height = m.height + "px";
  if (m.type === "vinokompas:add-to-cart")
    addToCart(m.id_product, m.qty || 1);              // ваша функция корзины
});
// после загрузки iframe — передать залогиненного клиента:
document.getElementById("vinokompas").addEventListener("load", () => {
  document.getElementById("vinokompas").contentWindow.postMessage(
    { type: "vinokompas:set-user", token: VK_TOKEN }, VK_ORIGIN);
});
</script>
```

## Контракт postMessage
- **iframe → страница:** `vinokompas:ready`, `vinokompas:resize {height}`, `vinokompas:add-to-cart {id_product, qty}`, `vinokompas:go-to-product {url}`
- **страница → iframe:** `vinokompas:set-user {token}`, `vinokompas:locale {lang}`

У каждого сообщения есть `source: "vinokompas"`. Всегда проверяйте `event.origin`.

## Токен SSO (JWT)
Claims: `{ sub: id_клиента, email, locale, cart_id, iat, exp }`
Подпись **HS256** общим секретом (только на сервере). Срок жизни **10–15 мин**.

## Endpoint каталога (на стороне магазина)
```
GET /api/vinokompas/products?grape=Riesling&style=white&limit=6
→ [{ id_product, name, grape, style, region, price, currency, image, url, in_stock }]
```
Опционально: проставьте винам атрибуты (grape/style/region/słodycz) в features
PrestaShop — тогда подбор точнее.

## Безопасность
- Токен короткоживущий и подписанный; секрет только на сервере.
- Всегда проверяйте `event.origin` при приёме postMessage.
- Только HTTPS.
- Корзина и сессия остаются на 100% на стороне магазина — iframe их не трогает.

## Фазы внедрения
1. **MVP:** iframe + клик по вину открывает реальную страницу товара winnica.pl в том же окне. (токен не нужен)
2. **+ реальный каталог:** endpoint каталога → реальные вина с ценой/наличием в самоучителе.
3. **+ корзина в iframe:** `add-to-cart` через postMessage.
4. **+ SSO/аккаунт:** токен → профиль вкуса сохраняется в кабинете, персонализация.
