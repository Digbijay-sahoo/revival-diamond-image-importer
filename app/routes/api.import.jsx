import { authenticate } from "../shopify.server";
import { uploadImageToShopify } from "../lib/shopifyFiles";

export async function action({ request }) {
  const { admin } = await authenticate.admin(request);

  console.log("===== API IMPORT HIT =====");

  // Replace this with one REAL supplier image URL
  const imageUrl =
    "https://image.brilliantearth.com/media/gemstone_ring_vto/MC/BE1D6351_SBLC8.0RD3_yellow_top.png";

  try {
    const result = await uploadImageToShopify(
      admin,
      imageUrl
    );

    console.log(
      "===== FILE CREATE RESPONSE ====="
    );

    console.log(
      JSON.stringify(result, null, 2)
    );

    return Response.json(result);

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