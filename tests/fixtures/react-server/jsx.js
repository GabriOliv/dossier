import { jsx, jsxClientOnly as only } from "react/jsx-runtime";

export const Box = () => jsx("b", { children: only });
