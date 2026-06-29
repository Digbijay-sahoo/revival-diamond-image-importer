export async function uploadImageToShopify(admin, imageUrl) {
  const mutation = `
    mutation fileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files {
          id
          alt
          ... on MediaImage {
            image {
              url
            }
          }
        }

        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await admin.graphql(mutation, {
    variables: {
      files: [
        {
          originalSource: imageUrl,
          contentType: "IMAGE",
        },
      ],
    },
  });

  const result = await response.json();

  return result;
}