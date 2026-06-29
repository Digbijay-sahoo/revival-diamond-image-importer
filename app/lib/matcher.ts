export function matchProducts(htmlProducts, shopifyProducts) {
  const matches = [];

  for (const html of htmlProducts) {
    const match = shopifyProducts.find(
      (shopify) => shopify.sku === html.rdSku
    );

    const titleMatched =
      match &&
      match.title.trim().toLowerCase() ===
        html.title.trim().toLowerCase();

    matches.push({
      ...html,

      matched: !!match,
      titleMatched: !!titleMatched,

      handle: match?.handle || "",
      sku: match?.sku || "",
      variantId: match?.variantId || "",

      image: html.image,
    });
  }

  return matches;
}