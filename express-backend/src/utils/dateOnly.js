// Utilitaires de date "date-only" (YYYY-MM-DD) sans effets de timezone

const pad2 = (n) => String(n).padStart(2, "0");

const formatYmd = (y, m, d) => `${y}-${pad2(m)}-${pad2(d)}`;

const formatLocalYmd = (date) =>
  formatYmd(date.getFullYear(), date.getMonth() + 1, date.getDate());

const formatUtcYmd = (date) =>
  formatYmd(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());

// Convertit Date/string -> YYYY-MM-DD, en évitant les décalages liés à UTC/local.
const toDateOnlyString = (value) => {
  if (!value) return null;

  // Strings
  if (typeof value === "string") {
    // Déjà au format DATE
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

    // ISO (avec heure / timezone) -> prendre la partie date sans reparser
    // (le reparse peut réintroduire un décalage selon le TZ du serveur)
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10);

    // Dernier recours: tenter de parser
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return toDateOnlyString(parsed);

    return value.split("T")[0];
  }

  // Dates
  if (value instanceof Date) {
    // mysql2 peut construire les DATE soit à minuit local, soit à minuit UTC.
    // On détecte lequel et on formate avec le bon getter.
    const isLocalMidnight =
      value.getHours() === 0 && value.getMinutes() === 0 && value.getSeconds() === 0;
    const isUtcMidnight =
      value.getUTCHours() === 0 &&
      value.getUTCMinutes() === 0 &&
      value.getUTCSeconds() === 0;

    if (isUtcMidnight && !isLocalMidnight) return formatUtcYmd(value);
    if (isLocalMidnight) return formatLocalYmd(value);

    // Si on reçoit une date avec heure (DATETIME/TIMESTAMP), on préfère UTC pour stabilité.
    return formatUtcYmd(value);
  }

  return String(value);
};

const todayLocalYmd = () => formatLocalYmd(new Date());

module.exports = {
  formatLocalYmd,
  formatUtcYmd,
  toDateOnlyString,
  todayLocalYmd,
};
