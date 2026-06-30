import { authenticate } from "../shopify.server";
import { uploadImageToShopify } from "../lib/shopifyFiles";

export async function action({ request }) {
  const { admin } = await authenticate.admin(request);

  console.log("===== API IMPORT HIT =====");

  try {
 const {
  sku,
  imageUrl,
  metafieldKey,
} = await request.json();

console.log("SKU:", sku);
console.log("Image:", imageUrl);
console.log("Metafield:", metafieldKey);
// -----------------------------
// Find Product by SKU
// -----------------------------
const productQuery = `
  query getVariantBySku($query: String!) {
    productVariants(first: 1, query: $query) {
      nodes {
        id
        sku
        product {
          id
          title
          handle
        }
      }
    }
  }
`;

const productResponse = await admin.graphql(
  productQuery,
  {
    variables: {
      query: `sku:${sku}`,
    },
  }
);

const productResult = await productResponse.json();

console.log("===== PRODUCT LOOKUP =====");
console.log(JSON.stringify(productResult, null, 2));

const variant = productResult.data.productVariants.nodes[0];

if (!variant) {
  throw new Error(`Variant not found for SKU: ${sku}`);
}

const product = variant.product;

console.log("===== FOUND PRODUCT =====");
console.log(product);
    // -----------------------------
    // Upload Image to Shopify Files
    // -----------------------------
    const uploadResult =
      await uploadImageToShopify(
        admin,
        imageUrl
      );

    const mediaImage =
      uploadResult?.data?.fileCreate?.files?.[0];

    if (!mediaImage?.id) {
      throw new Error("Image upload failed.");
    }

    // -----------------------------
    // Update Product Metafield
    // -----------------------------
    const metafieldMutation = `
      mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            namespace
            key
            value
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const metafieldResponse =
      await admin.graphql(
        metafieldMutation,
        {
          variables: {
            metafields: [
              {
                ownerId: product.id,
                namespace: "custom",
                key: metafieldKey,
                type: "file_reference",
                value: mediaImage.id,
              },
            ],
          },
        }
      );

    const metafieldResult =
      await metafieldResponse.json();

    console.log(
      "===== METAFIELD RESULT ====="
    );

    console.log(
      JSON.stringify(
        metafieldResult,
        null,
        2
      )
    );

    return Response.json({
      success: true,
      upload: uploadResult,
      metafield: metafieldResult,
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}