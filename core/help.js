// Adds business days (Mon-Fri). Public holidays are NOT handled.
export function addBusinessDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00Z");
  while (n > 0) { d.setUTCDate(d.getUTCDate() + 1); if (![0, 6].includes(d.getUTCDay())) n--; }
  return d.toISOString().slice(0, 10);
}
export function complaintDraft({ provider, date, amount, reference, description }) {
  return `To: ${provider} Customer Complaints\n\nI am filing a complaint about a transaction on ${date}.\nAmount: ${amount} birr\nTransaction reference: ${reference}\nWhat happened: ${description}\n\nPlease investigate and tell me the outcome in writing. If it is not resolved, I will take it to the National Bank of Ethiopia's Financial Consumer Protection directorate.\n`;
}
