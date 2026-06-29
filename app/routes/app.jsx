import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  console.log("===== APP LOADER START =====");
  console.log("URL:", request.url);

  try {
    await authenticate.admin(request);
    console.log("Authentication successful");
  } catch (e) {
    console.error("AUTH ERROR:");
    console.error(e);
    throw e;
  }

  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
  };
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <Outlet />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (args) => boundary.headers(args);