import { authenticate } from "../shopify.server";
import { PRODUCT_METAFIELDS } from "../lib/metafields";

export async function action({ request }) {
  const { admin } = await authenticate.admin(request);

  try {
    // -----------------------------
    // Fetch existing product metafield definitions
    // -----------------------------
    const query = `
      query {
        metafieldDefinitions(
          first: 250,
          ownerType: PRODUCT
        ) {
          nodes {
            id
            namespace
            key
            name
          }
        }
      }
    `;

    const response = await admin.graphql(query);
    const result = await response.json();

    const existingDefinitions =
      result.data.metafieldDefinitions.nodes;

    const existing = new Set(
      existingDefinitions.map(
        (m) => `${m.namespace}.${m.key}`
      )
    );

    let created = 0;
    let skipped = 0;

    const summary = [];

    // -----------------------------
    // Create missing definitions
    // -----------------------------
    for (const field of PRODUCT_METAFIELDS) {
      const lookup =
        `${field.namespace}.${field.key}`;

      if (existing.has(lookup)) {
        skipped++;

        summary.push({
          label: field.label,
          status: "Exists",
        });

        continue;
      }

      const mutation = `
        mutation createDefinition(
          $definition: MetafieldDefinitionInput!
        ) {
          metafieldDefinitionCreate(
            definition: $definition
          ) {
            createdDefinition {
              id
              name
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const createResponse =
        await admin.graphql(
          mutation,
          {
            variables: {
              definition: {
                name: field.label,
                namespace: field.namespace,
                key: field.key,
                ownerType: "PRODUCT",
                type: field.type,
              },
            },
          }
        );

      const createResult =
        await createResponse.json();

      const errors =
        createResult.data
          .metafieldDefinitionCreate
          .userErrors;

      if (errors.length > 0) {
        summary.push({
          label: field.label,
          status: errors[0].message,
        });

        continue;
      }

      created++;

      summary.push({
        label: field.label,
        status: "Created",
      });
    }

    return Response.json({
      success: true,
      created,
      skipped,
      results: summary,
    });

  } catch (err) {
    console.error(err);

    return Response.json(
      {
        success: false,
        error: err.message,
      },
      {
        status: 500,
      }
    );
  }
}