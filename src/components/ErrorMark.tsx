/** Dossier's errorMark: the red square with an X, used by every error-state component. */
export function ErrorMark({ size }: { size?: number }) {
  const n = size || 14;
  return (
    <svg className="ds-err-mark" viewBox="0 0 14 14" width={n} height={n} aria-hidden="true">
      <rect className="ds-err-mark-box" x={0} y={0} width={14} height={14} />
      <path className="ds-err-mark-x" d="M4 4 L10 10 M10 4 L4 10" />
    </svg>
  );
}
