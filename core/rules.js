// Point-in-time lookup: which rule value applied on a given date (YYYY-MM-DD)?
export const asOf = (topic, date) =>
  topic.values.filter((v) => v.from <= date).sort((a, b) => (a.from < b.from ? -1 : 1)).pop() ?? null;
export const searchTopics = (rules, q) => {
  const s = q.toLowerCase().trim();
  return s ? rules.topics.filter((t) => (t.title + " " + t.tags + " " + t.values.map((v) => v.text).join(" ")).toLowerCase().includes(s)) : rules.topics;
};
