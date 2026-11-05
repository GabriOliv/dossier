import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../../dist/styles.css";
import "../../dist/base.css";
import "../gallery.css";
import "./gallery-page.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
