// resources/js/app.jsx
import "./bootstrap";
import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob("./Pages/**/*.{js,jsx,ts,tsx}", { eager: true });

    const page =
      pages[`./Pages/${name}.jsx`] ||
      pages[`./Pages/${name}.js`] ||
      pages[`./Pages/${name}.tsx`] ||
      pages[`./Pages/${name}.ts`];

    if (!page) {
      throw new Error(
        `Inertia page not found: ./Pages/${name} (checked .jsx .js .tsx .ts)`
      );
    }

    return page;
  },
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />);
  },
});
