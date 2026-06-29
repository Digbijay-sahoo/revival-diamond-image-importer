import Papa from "papaparse";

export function parseShopifyCsv(csvText) {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  return result.data.map((row) => ({
    handle: row.Handle?.trim() || "",
    title: row.Title?.trim() || "",
    sku: row["Variant SKU"]?.trim() || "",
    productId: row.ID?.trim() || "",
    variantId: row["Variant ID"]?.trim() || "",
  }));
}