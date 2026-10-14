# Data sources, terms and how we keep it reliable
## Dollar rates (live)
- **Banks:** ET-Forex public API `GET https://api.et-forex.com/api/v1/rates/ranking?currency=USD` (published bank boards, cash and transactional, per-bank dates, stale flags). Free in preview, readable without a key.
  ET-Forex terms (22 Aug 2026): show ET-Forex as the source where users can see it (the app does), do not republish the feed, do not embed an API key in a public app (the app uses no key), and do not scrape outside the API.
  Dependency risk: if the API changes or limits anonymous use, ask ET-Forex for a partner key and call it from a small server of yours.
- **Official NBE rate:** AllRatesToday open API `GET https://allratestoday.com/api/open/central-bank/nbe?source=USD&target=ETB`. Terms: free with visible attribution (the app links it).
- **Meaning of the numbers:** the API calls the rate you pay to buy dollars "buy" and the rate you get when selling "sell". The app says "I need dollars" / "I have dollars" and keeps Cash and Transfer rates separate. Never compare a cash rate with a transfer rate.
- **Checks:** banks not updated today are listed apart; a rate more than 5% away from NBE's official rate, or where you would "get" more than you "pay", is left out and shown as a warning.
- Rates are cached on the phone after each successful load; nothing is bundled in the app.
## Fees (verified by reading the official pages, dated in `core/data/fees.json`)
CBE (tariff PDF + terms page), Bank of Abyssinia (tariff page, charges before 15% VAT), Siinqee (tariff page), Amhara Bank (tariff PDF), Dashen (terms and tariffs page), telebirr (official pricing page), NBE FX fee table (all 32 banks, 4% total).
Awash is not included: its page shows "existing" and "proposed" tariffs without saying which applies.
## Rules
`core/data/rules.json`: NBE announcements and law-firm summaries with dates and links.
