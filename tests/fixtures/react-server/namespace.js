import * as React from "react";

export const Box = React.forwardRef(function Box() {
  return React.useState(0)[0];
});
