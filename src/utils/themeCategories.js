export function getThemeCategories(themeOrCategory) {
  const rawCategory =
    themeOrCategory && typeof themeOrCategory === "object" && !Array.isArray(themeOrCategory)
      ? themeOrCategory.category
      : themeOrCategory;

  if (Array.isArray(rawCategory)) {
    return rawCategory
      .map((category) => String(category || "").trim())
      .filter(Boolean);
  }

  const category = String(rawCategory || "").trim();
  return category ? [category] : [];
}

export function formatThemeCategories(themeOrCategory, separator = ", ") {
  return getThemeCategories(themeOrCategory).join(separator);
}

export function themeMatchesCategory(theme, category) {
  if (!category || category === "Semua") return true;
  return getThemeCategories(theme).includes(category);
}
