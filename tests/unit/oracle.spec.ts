import { expect, test } from "@playwright/test";
import { normalizeIds, renameTypeClasses } from "./oracle";

test("oracle renames only the nine typography classes, only inside class attributes", () => {
  const html = '<span class="label ds-tag figure-xl title-x" title="label">label body</span>';
  expect(renameTypeClasses(html)).toBe(
    '<span class="ds-t-label ds-tag ds-t-figure-xl title-x" title="label">label body</span>',
  );
});

test("oracle numbers ids by first appearance and keeps references aligned", () => {
  const a =
    '<label for="ds-tf-1"></label><input id="ds-tf-1" aria-describedby="ds-tf-1-msg"/><div id="ds-tf-1-msg"></div>';
  const b =
    '<label for="ds-tf-r0"></label><input id="ds-tf-r0" aria-describedby="ds-tf-r0-msg"/><div id="ds-tf-r0-msg"></div>';
  expect(normalizeIds(a)).toBe(normalizeIds(b));
  expect(normalizeIds('<pattern id="h1"></pattern><polygon fill="url(#h1)"/>')).toBe(
    '<pattern id="«id1»"></pattern><polygon fill="url(#«id1»)"/>',
  );
});

test("oracle id normalization still tells a broken reference apart", () => {
  const ok = '<label for="a"></label><input id="a"/>';
  const broken = '<label for="a"></label><input id="b"/>';
  expect(normalizeIds(ok)).not.toBe(normalizeIds(broken));
});

test("oracle leaves ds-tf-* classes alone", () => {
  expect(normalizeIds('<div class="ds-tf-1"></div>')).toBe('<div class="ds-tf-1"></div>');
});
