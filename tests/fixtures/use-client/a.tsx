/**
 * @license MIT
 * A client module whose directive comes after a license comment.
 */
"use client";
import { useState } from "react";

export function A() {
  const [n] = useState(0);
  return <b>{n}</b>;
}
