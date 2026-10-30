import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/fonts.css";
import "./styles/global.css";
import App from "./App.jsx";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (import.meta.env.DEV) {
  Promise.all([import("@axe-core/react"), import("react"), import("react-dom")]).then(
    ([axe, React, ReactDOM]) => axe.default(React, ReactDOM, 1000),
  );
}
