# BirrRoute: dollar rates first, local transfers second 
   > Find the best bank for your dollars and the cheapest way to move birr in Ethiopia.

   <img src="docs/dollars.JPG" width="220"> <img src="docs/transfer.JPG" width="220"> <img src="docs/fees.JPG" width="220"> <img src="docs/amharic.JPG" width="220">
**Main focus: dollars.** Which Ethiopian bank gives the best rate for your dollars today, and what a dollar purchase really costs.
- **Dollars (home):** "I have dollars" ranks banks by what they pay you; "I need dollars" ranks by total cost incl. the NBE 4% fee cap.
  Wrong-looking rates are flagged and left out (e.g. a bank showing 132 when the rest show ~161). A "Check a quote" box tells you how your bank's offer compares.
- **Birr transfers (secondary):** cheapest route across banks, telebirr, CBE Birr and cash. 3 questions, one answer, sources shown.
- **My fees**, **Rules** (what the NBE rule was on a date), **Help** (failed-transfer steps, complaint writer, saved cases).
- 5 languages, light/dark switch, data stays on the phone.

## Run
1. `npx create-expo-app@latest birrroute-app --template blank`
2. Copy `App.js`, `src/`, `core/`, `assets/` into it; merge `app.json.example` into `app.json`.
3. `npx expo install @react-native-async-storage/async-storage`
4. `npx expo start --clear`. Logic tests: `cd core && npm test`.

## What makes it different from rate boards (exchange.et, ET-Forex, EthioForex)
| Rate boards | BirrRoute |
|---|---|
| Show a table of rates | Gives one answer: "best bank for $X", cash vs transfer kept apart |
| Rates only | Also the cheapest way to move birr (banks, telebirr, CBE Birr, cash), with fee sources |
| English | English, Amharic, Afaan Oromoo, Tigrinya, Somali (drafts, need native review) |
| Trust = timestamps | Timestamps + stale banks listed apart + rates far from NBE's official rate rejected + "check my bank's quote" |

## Data
See `DATA_SOURCES.md`. Live dollar rates come from ET-Forex's public API (credited in the app) and the official NBE rate from AllRatesToday. Fees come from banks' own tariff pages with the date checked. Nothing about the user is collected.

## Honest limits
- Live rates depend on a third-party API (free in preview). If it fails, the app shows the last saved rates with their time.
- Transfer fees are verified for CBE, Bank of Abyssinia, Siinqee, Amhara Bank, Dashen and telebirr only; other banks say "fees not added yet". Awash is left out until its current tariff is clear.
- Translations are drafts; rule texts are English. No push alerts: the rate watch checks when the app opens.
- Informational only, not financial advice. Always confirm the rate and fee with the bank.
