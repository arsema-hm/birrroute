# Release checklist
1. Set `FEEDBACK_EMAIL` (and optionally `REMOTE_URL`) at the top of `App.js`.
2. In `app.json`: set `name`, `slug`, `android.package` (e.g. com.yourname.birrroute), `ios.bundleIdentifier`, `version`.
3. Have native speakers review `core/i18n.js`. Re-verify fees (see below) and update `last_checked`.
4. `npm i -g eas-cli`, `eas login`, `eas build -p android --profile preview` (APK for testers), later `--profile production` (AAB for Play Store).
5. Play Store: create a developer account, upload the AAB, add screenshots, the privacy policy URL (host PRIVACY.md), and a data-safety form answering "no data collected".
6. Test on a low-end Android phone and with data/Wi-Fi off.

## Keeping fees correct (the real work)
Monthly: open each source_url in `fees.json`, compare, update the number and `last_checked`. When a bank changes a fee, change the rule's `effective_to` and add a new rule with a new `effective_from`.
Add a bank: copy a rule, set `from`/`to`, tiers (flat or pct), limits, `includes_vat` (false if the page says VAT is added), the page URL, and add a test in `core/test/fee.test.js`.

## Dollar rates (live)
Rates load live from ET-Forex's public API and NBE's rate from AllRatesToday (see DATA_SOURCES.md for their terms: keep the visible credits, never embed a key in the app, never republish the feed).
Before you publish widely, email ET-Forex to ask for a partner key and permission for your expected traffic; then call their API from a small server of yours and keep this app calling your server.

## Keeping fees fresh (do this every month)
1. `node tools/fee-age-report.mjs` lists every fee, oldest check first. Open each `source_url`, confirm the numbers, fix `core/data/fees.json` and set `last_checked` to today. When a fee changes, set the old rule's `effective_to` and add a new rule with a new `effective_from`.
2. Update `version` and `updated` in `fees.json`, run `cd core && npm test`.
3. `node tools/make-data-json.mjs` creates `data.json`. Host it at a public https address (for example a GitHub repository's raw file) and put that address in `REMOTE_URL` at the top of `App.js`. Phones then pick up the new fees the next time they open the app online, without a new release.
4. If you skip a month, the app warns users on any route whose fee was last checked more than 45 days ago.
