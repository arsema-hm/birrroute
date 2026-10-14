# Translating BirrRoute
All text is in `core/i18n.js`. Each key has 5 entries in this order: English, Amharic, Afaan Oromoo, Tigrinya, Somali.
1. Ask a native speaker (ideally someone who uses mobile banking) to read every line aloud and fix wording.
2. Keep placeholders like {n}, {d}, {a} unchanged. `npm test` in `core/` checks this.
3. To add a language (Afar, Sidaama, Wolayttatto, Guragigna, Hadiyyisa, Gamo, Kafi noonoo): add it to `LANGS`, add its code to `IDX`, and append a translation to each key. Missing entries fall back to English.
Do not publish a language to the Play Store until a native speaker has reviewed it: wrong money instructions can hurt people.
