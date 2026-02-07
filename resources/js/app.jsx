import "./bootstrap";
import "../css/app.css";
import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import Layout from "./layouts/Layout";

createInertiaApp({
  title: (title) => (title ? `${title}` : "Page title"),
  resolve: async (name) => {
    const pages = import.meta.glob("./Pages/**/*.jsx", { eager: true });
    const pagePath = `./Pages/${name}.jsx`;
    const page = pages[pagePath];

    if (!page?.default) throw new Error(`Page not found or missing default export: ${pagePath}`);

    page.default.layout = page.default.layout || ((p) => <Layout>{p}</Layout>);
    return page;
  },
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />);
  },
  progress: { color: "#009f69" },
});
