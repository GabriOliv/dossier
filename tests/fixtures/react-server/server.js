import { forwardRef, useState } from "react";

export const Counter = forwardRef(function Counter() {
  return useState(0)[0];
});
