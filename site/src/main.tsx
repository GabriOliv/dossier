import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../../dist/styles.css";
import "../../dist/base.css";
import "../site.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
