import R, { forwardRef, useRef } from "react";

export const Box = forwardRef(function Box() {
  R.useEffect(() => {});
  return useRef(null).current;
});
