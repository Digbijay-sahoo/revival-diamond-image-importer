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
  Banner,
} from "@shopify/polaris";

import { useState } from "react";

export default function HomePage() {
  const [mode, setMode] = useState("variant");
  const [selectedWhiteMetafield, setSelectedWhiteMetafield] = useState(
  PRODUCT_METAFIELDS[0]
);

const [selectedYellowMetafield, setSelectedYellowMetafield] = useState(
  PRODUCT_METAFIELDS[0]
);

const [whiteHtmlFile, setWhiteHtmlFile] = useState(null);
const [yellowHtmlFile, setYellowHtmlFile] = useState(null);
const [csvFile, setCsvFile] = useState(null);
  const [parsedProducts, setParsedProducts] = useState([]);
  const [csvProducts, setCsvProducts] = useState([]);
  const [matchedProducts, setMatchedProducts] = useState([]);
  const [metafieldSummary, setMetafieldSummary] = useState(null);
  const [creatingMetafields, setCreatingMetafields] = useState(false);
  const [whiteProgress, setWhiteProgress] = useState(0);
  const [yellowProgress, setYellowProgress] = useState(0);
  const [whiteTotal, setWhiteTotal] = useState(0);
  const [yellowTotal, setYellowTotal] = useState(0);
  const [failedSkus, setFailedSkus] = useState([]);

  async function startImport() {
    setFailedSkus([]);
   if (!whiteHtmlFile && !yellowHtmlFile) {
  alert("Please select at least one Supplier HTML.");
  return;
}

    if (!csvFile) {
      alert("Please select Shopify CSV.");
      return;
    }

   let htmlProducts = [];

if (whiteHtmlFile) {
  const html = await whiteHtmlFile.text();
  htmlProducts.push(...parseSupplierHtml(html));
}

if (yellowHtmlFile) {
  const html = await yellowHtmlFile.text();
  htmlProducts.push(...parseSupplierHtml(html));
}

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
  }
async function testShopifyUpload() {
  try {
    if (matchedProducts.length === 0) {
      alert("Parse files first.");
      return;
    }

   let success = 0;
   let failed = [];
   setFailedSkus([]);
   setWhiteProgress(0);
   setYellowProgress(0);
   setWhiteTotal(0);
   setYellowTotal(0);

const uploadProducts = async (products, metafield) => {

  for (const product of products) {

    const response = await fetch("/api/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sku: product.rdSku,
        imageUrl: product.image,
        metafieldKey: metafield.key,
      }),
    });

    const result = await response.json();

    if (result.success) {
  success++;

  if (metafield.key === selectedWhiteMetafield.key) {
    setWhiteProgress(prev => prev + 1);
  }

  if (metafield.key === selectedYellowMetafield.key) {
    setYellowProgress(prev => prev + 1);
  }

} else {
      failed.push(product.rdSku);
    }
  }

};

    const whiteProducts = matchedProducts.filter(
  p => whiteHtmlFile && p.rdSku.endsWith("14KW")
);

const yellowProducts = matchedProducts.filter(
  p => yellowHtmlFile && p.rdSku.endsWith("14KY")
);
setWhiteTotal(whiteProducts.length);
setYellowTotal(yellowProducts.length);

if (whiteProducts.length) {
  await uploadProducts(
    whiteProducts,
    selectedWhiteMetafield
  );
}

if (yellowProducts.length) {
  await uploadProducts(
    yellowProducts,
    selectedYellowMetafield
  );
}
setFailedSkus(failed);
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}
async function createMissingMetafields() {
  try {
    setCreatingMetafields(true);

    const response = await fetch("/api/metafields", {
      method: "POST",
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    setMetafieldSummary(result);

    alert(
      `Done!

Created: ${result.created}
Skipped: ${result.skipped}`
    );

  } catch (err) {
    console.error(err);
    alert(err.message);
  } finally {
    setCreatingMetafields(false);
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
  Supplier HTML (White)
</Text>

<input
  type="file"
  accept=".html"
  onChange={(e) => {
    if (e.target.files.length) {
      setWhiteHtmlFile(e.target.files[0]);
    }
  }}
/>

<Text variant="headingMd" as="h3">
  Supplier HTML (Yellow)
</Text>

<input
  type="file"
  accept=".html"
  onChange={(e) => {
    if (e.target.files.length) {
      setYellowHtmlFile(e.target.files[0]);
    }
  }}
/>

          </BlockStack>
<Divider />

<BlockStack gap="300"> 

  <Text variant="headingMd">
    Product Metafield (White)
  </Text>

  <select
    style={{
      padding: "10px",
      borderRadius: "8px",
      border: "1px solid #ccc",
      fontSize: "14px",
    }}
    value={selectedWhiteMetafield.key}
    onChange={(e) => {
      const metafield = PRODUCT_METAFIELDS.find(
        (m) => m.key === e.target.value
      );

      setSelectedWhiteMetafield(metafield);
    }}
  >
    {PRODUCT_METAFIELDS.map((field) => (
      <option key={field.key} value={field.key}>
        {field.label}
      </option>
    ))}
  </select>

  <Text variant="headingMd">
    Product Metafield (Yellow)
  </Text>

  <select
    style={{
      padding: "10px",
      borderRadius: "8px",
      border: "1px solid #ccc",
      fontSize: "14px",
    }}
    value={selectedYellowMetafield.key}
    onChange={(e) => {
      const metafield = PRODUCT_METAFIELDS.find(
        (m) => m.key === e.target.value
      );

      setSelectedYellowMetafield(metafield);
    }}
  >
    {PRODUCT_METAFIELDS.map((field) => (
      <option key={field.key} value={field.key}>
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
<Text variant="bodyMd">
  White Progress: {whiteProgress} / {whiteTotal}
</Text>

<Text variant="bodyMd">
  Yellow Progress: {yellowProgress} / {yellowTotal}
</Text>
{failedSkus.length > 0 && (
  <Card>
    <BlockStack gap="200">

      <Text variant="headingMd">
        Failed SKUs ({failedSkus.length})
      </Text>

      {failedSkus.map((sku) => (
        <Text key={sku}>{sku}</Text>
      ))}

    </BlockStack>
  </Card>
)}
{false && (
  <Button
    variant="secondary"
    loading={creatingMetafields}
    onClick={createMissingMetafields}
  >
    Create Missing Metafields
  </Button>
)}
          

        </BlockStack>
      </Card>
{metafieldSummary && (
  <Card>
    <BlockStack gap="300">

      <Banner
        tone="success"
        title="Metafield Definitions Complete"
      >
        <p>
          Created: {metafieldSummary.created}
        </p>

        <p>
          Skipped: {metafieldSummary.skipped}
        </p>
      </Banner>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th align="left">Metafield</th>
            <th align="left">Status</th>
          </tr>
        </thead>

        <tbody>
          {metafieldSummary.results.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td>{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </BlockStack>
  </Card>
)}
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