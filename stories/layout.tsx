import type { ReactNode } from "react";

/** Story layout only (the gallery's .ds-row and .gal-stack are not shipped). */
export const Row = ({ children }: { children: ReactNode }) => (
  <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>{children}</div>
);

export const Stack = ({ children }: { children: ReactNode }) => (
  <div style={{ display: "grid", gap: 24, maxWidth: 560 }}>{children}</div>
);
