import { parseSupplierHtml } from "../lib/htmlParser";
import { parseShopifyCsv } from "../lib/csvParser";
import { matchProducts } from "../lib/matcher";
import { PRODUCT_METAFIELDS } from "../lib/metafields";

import {
  Page,
  Card,
  BlockStack,
  Button,
  Text,
  RadioButton,
  Divider,
} from "@shopify/polaris";

import { useState } from "react";

export default function HomePage() {
  const [mode, setMode] = useState("variant");
  const [selectedMetafield, setSelectedMetafield] = useState(
  PRODUCT_METAFIELDS[0]
);

  const [htmlFile, setHtmlFile] = useState(null);
  const [csvFile, setCsvFile] = useState(null);

  const [parsedProducts, setParsedProducts] = useState([]);
  const [csvProducts, setCsvProducts] = useState([]);
  const [matchedProducts, setMatchedProducts] = useState([]);

  async function startImport() {
    if (!htmlFile) {
      alert("Please select Supplier HTML.");
      return;
    }

    if (!csvFile) {
      alert("Please select Shopify CSV.");
      return;
    }

    // Parse HTML
    const html = await htmlFile.text();
    const htmlProducts = parseSupplierHtml(html);

    // Parse CSV
    const csv = await csvFile.text();
    const shopifyProducts = parseShopifyCsv(csv);

  // Match HTML with Shopify CSV
const matches = matchProducts(
  htmlProducts,
  shopifyProducts
);

setParsedProducts(htmlProducts);
setCsvProducts(shopifyProducts);
setMatchedProducts(matches);

console.log("HTML Products:", htmlProducts);
console.log("CSV Products:", shopifyProducts);
console.log("Matches:", matches);
console.log("Selected Metafield:", selectedMetafield);
  }
async function testShopifyUpload() {
  try {
    if (matchedProducts.length === 0) {
      alert("Parse files first.");
      return;
    }

    let success = 0;
    let failed = [];

    for (const product of matchedProducts) {
      console.log("===== IMPORTING =====");
      console.log(product.rdSku);

      const response = await fetch("/api/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sku: product.rdSku,
          imageUrl: product.image,
          metafieldKey: selectedMetafield.key,
        }),
      });

      const result = await response.json();

      if (result.success) {
        success++;
        console.log("✅ Imported:", product.rdSku);
      } else {
        failed.push(product.rdSku);
        console.log("❌ Failed:", product.rdSku, result.error);
      }
    }

    alert(
      `Import Complete

Success: ${success}
Failed: ${failed.length}

${failed.length ? failed.join("\n") : ""}`
    );

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

  return (
    <Page title="💎 Revival Diamond Image Importer">
      <Card>
        <BlockStack gap="500">

          <Text variant="headingLg" as="h2">
            Bulk Image Import Tool
          </Text>

          <Text as="p">
            Upload supplier HTML and Shopify CSV.
          </Text>

          <Divider />

          <BlockStack gap="300">

            <Text variant="headingMd" as="h3">
              Shopify CSV
            </Text>

            <input
  type="file"
  accept=".csv"
  onChange={(e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
      console.log("CSV Selected:", e.target.files[0].name);
    }
  }}
/>

            <Text variant="headingMd" as="h3">
              Supplier HTML
            </Text>

            <input
              type="file"
              accept=".html"
              onChange={(e) => {
                if (e.target.files.length) {
                  setHtmlFile(e.target.files[0]);
                }
              }}
            />

          </BlockStack>
<Divider />

<BlockStack gap="300">

  <Text variant="headingMd">
    Product Metafield
  </Text>

  <select
    style={{
      padding: "10px",
      borderRadius: "8px",
      border: "1px solid #ccc",
      fontSize: "14px",
    }}
    value={selectedMetafield.key}
    onChange={(e) => {
      const metafield = PRODUCT_METAFIELDS.find(
        (m) => m.key === e.target.value
      );

      setSelectedMetafield(metafield);

      console.log("Selected Metafield:", metafield);
    }}
  >
    {PRODUCT_METAFIELDS.map((field) => (
      <option
        key={field.key}
        value={field.key}
      >
        {field.label}
      </option>
    ))}
  </select>

</BlockStack>
          <Divider />

          <BlockStack gap="200">

            <Text variant="headingMd">
              Import Mode
            </Text>

            <RadioButton
              label="Product Images"
              checked={mode === "product"}
              onChange={() => setMode("product")}
            />

            <RadioButton
              label="Variant Images"
              checked={mode === "variant"}
              onChange={() => setMode("variant")}
            />

            <RadioButton
              label="Variant Metafields"
              checked={mode === "metafields"}
              onChange={() => setMode("metafields")}
            />

          </BlockStack>

          <Divider />

          <Button variant="primary" onClick={startImport}>
            Parse Files
          </Button>
          <Button onClick={testShopifyUpload}>
  Test Shopify Upload
</Button>

        </BlockStack>
      </Card>

      {parsedProducts.length > 0 && (
        <Card>
          <BlockStack gap="300">

            <Text variant="headingMd">
              Parsed HTML Products ({parsedProducts.length})
            </Text>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th>BE SKU</th>
                  <th>RD SKU</th>
                  <th>Title</th>
                  <th>Image</th>
                </tr>
              </thead>

              <tbody>
                {parsedProducts.map((product) => (
                  <tr key={product.rdSku}>
                    <td>{product.beSku}</td>
                    <td>{product.rdSku}</td>
                    <td>{product.title}</td>
                    <td>
                      <a
                        href={product.image}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          </BlockStack>
        </Card>
      )}

      {csvProducts.length > 0 && (
        <Card>
          <BlockStack gap="300">

            <Text variant="headingMd">
              Shopify CSV ({csvProducts.length})
            </Text>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th>Handle</th>
                  <th>Title</th>
                  <th>SKU</th>
                  <th>Variant ID</th>
                </tr>
              </thead>

              <tbody>
                {csvProducts.slice(0, 20).map((product) => (
                  <tr key={product.variantId}>
                    <td>{product.handle}</td>
                    <td>{product.title}</td>
                    <td>{product.sku}</td>
                    <td>{product.variantId}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Text as="p">
              Showing first 20 Shopify products.
            </Text>

          </BlockStack>
        </Card>
      )}
      {matchedProducts.length > 0 && (
  <Card>
    <BlockStack gap="300">

      <Text variant="headingMd">
        Matched Products ({matchedProducts.length})
      </Text>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
         <tr>
          <th>SKU</th>
          <th>Title</th>
          <th>Handle</th>
          <th>RD SKU</th>
          <th>Variant ID</th>
          <th>Product Title</th>
          <th>Image</th>
        </tr>
        </thead>

        <tbody>
          {matchedProducts.map((product) => (
            <tr key={product.rdSku}>
  <td>{product.matched ? "✅" : "❌"}</td>

  <td>{product.titleMatched ? "✅" : "⚠️"}</td>

  <td>{product.handle}</td>

  <td>{product.rdSku}</td>

  <td>{product.variantId}</td>

  <td>{product.title}</td>

  <td>
    {product.image ? (
      <a
        href={product.image}
        target="_blank"
        rel="noreferrer"
      >
        View
      </a>
    ) : (
      "-"
    )}
  </td>
</tr>
          ))}
        </tbody>
      </table>

    </BlockStack>
  </Card>
)}
    </Page>
  );
}