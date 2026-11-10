"use client";
import { useState } from "react";

export function C() {
  const [n] = useState(1);
  return <u>{n}</u>;
}
