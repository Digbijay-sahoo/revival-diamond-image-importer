import * as cheerio from "cheerio";

export function parseSupplierHtml(html) {
  const $ = cheerio.load(html);

  const products = [];
  const seenSkus = new Set();

  $(".per-product").each((_, product) => {
    const card = $(product);

    // SKU of THIS product block
    const beSku =
      card.attr("data-style-number")?.trim() || "";

    if (!beSku) return;

    // We only care about 14K White & 14K Yellow
    if (
      !beSku.endsWith("14KW") &&
      !beSku.endsWith("14KY")
    ) {
      return;
    }

    if (seenSkus.has(beSku)) {
      return;
    }

    seenSkus.add(beSku);

    // Convert BE -> RD
    const rdSku = beSku.replace(/^BE/, "RD");

    // Product title
    const title = card
      .find(".title1")
      .text()
      .replace(/\s+/g, " ")
      .trim();

    // Main image for THIS product block
    let image =
      card.find("img.js_main_image").attr("data-original") || "";

    if (image.startsWith("//")) {
      image = "https:" + image;
    }

    products.push({
      beSku,
      rdSku,
      title,
      image,
    });
  });

  return products;
}