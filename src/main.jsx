import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import "./styles/fonts.css";
import "./styles/global.css";
import App from "./App.jsx";

// /#tv opens the big-screen version. Its code, styles and pictures load only there, never on phones.
// A TV's own browser (Samsung, LG, Sony, Fire TV, Android TV…) gets it without the #tv; #phone forces the phone app.
const TV_BROWSER = /SMART-?TV|Tizen|Web0S|webOS.*TV|NetCast|HbbTV|BRAVIA|Android TV|GoogleTV|AFT[A-Z]|CrKey|\bTV Safari/i;
const isTv = () =>
  location.hash.startsWith("#tv") ||
  (TV_BROWSER.test(navigator.userAgent) && !location.hash.startsWith("#j=") && !location.hash.startsWith("#phone"));
const tv = isTv();
const TvApp = lazy(() => import("./tv/TvApp.jsx"));
document.documentElement.classList.toggle("tv", tv);
window.addEventListener("hashchange", () => {
  if (isTv() !== tv) location.reload();
});

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    {tv ? (
      <Suspense fallback={null}>
        <TvApp />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);

if (import.meta.env.DEV) {
  Promise.all([import("@axe-core/react"), import("react"), import("react-dom")]).then(
    ([axe, React, ReactDOM]) => axe.default(React, ReactDOM, 1000),
  );
}
