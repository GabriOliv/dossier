import "@gabrioliv/dossier/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Slice from "./Slice";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Slice />
  </StrictMode>,
);
