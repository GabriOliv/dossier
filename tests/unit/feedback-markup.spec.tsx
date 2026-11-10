import { test } from "@playwright/test";
import type { ReactElement } from "react";
import { Divider } from "../../src/components/Divider";
import { Grid } from "../../src/components/Grid";
import { Icon } from "../../src/components/Icon";
import { Skeleton } from "../../src/components/Skeleton";
import { Spinner } from "../../src/components/Spinner";
import { Stack } from "../../src/components/Stack";
import { Toaster } from "../../src/components/Toaster";
import { expectMarkup } from "./markup";
import { render } from "./oracle";

const cases = (list: [string, ReactElement][]): [string, string][] => list.map(([name, el]) => [name, render(el)]);

test("FBL-01 Icon markup matches its snapshot", () => {
  expectMarkup(
    "Icon",
    cases([
      ["default", <Icon name="check" />],
      ["size 24", <Icon name="search" size={24} />],
      ["label", <Icon name="close" label="Fechar" />],
      ["id and className", <Icon name="info" id="x" className="y" />],
    ]),
  );
});

test("FBL-01 Spinner markup matches its snapshot", () => {
  expectMarkup(
    "Spinner",
    cases([
      ["default", <Spinner />],
      ["labels", <Spinner labels={{ label: "Carregando" }} />],
      ["id and className", <Spinner id="x" className="y" />],
    ]),
  );
});

test("FBL-01 Skeleton markup matches its snapshot", () => {
  expectMarkup(
    "Skeleton",
    cases([
      ["text", <Skeleton />],
      ["block with height", <Skeleton variant="block" height="120px" />],
      ["block with a number", <Skeleton variant="block" height={48} />],
      ["id and className", <Skeleton id="x" className="y" />],
    ]),
  );
});

test("FBL-01 Stack markup matches its snapshot", () => {
  expectMarkup(
    "Stack",
    cases([
      ["default", <Stack>A</Stack>],
      [
        "row, gap, align, justify and wrap",
        <Stack direction="row" gap={6} align="center" justify="between" wrap>
          A
        </Stack>,
      ],
      ["id and className", <Stack id="x" className="y" />],
    ]),
  );
});

test("FBL-01 Grid markup matches its snapshot", () => {
  expectMarkup(
    "Grid",
    cases([
      ["columns", <Grid columns={3}>A</Grid>],
      ["minColumnWidth", <Grid minColumnWidth="200px" gap={4} />],
      ["id and className", <Grid id="x" className="y" />],
    ]),
  );
});

test("FBL-01 Divider markup matches its snapshot", () => {
  expectMarkup(
    "Divider",
    cases([
      ["default", <Divider />],
      ["rule", <Divider weight="rule" />],
      ["heavy vertical", <Divider weight="heavy" orientation="vertical" />],
      ["id and className", <Divider id="x" className="y" />],
    ]),
  );
});

test("FBL-01 Toaster markup matches its snapshot", () => {
  expectMarkup(
    "Toaster",
    cases([
      ["default", <Toaster />],
      ["labels, id and className", <Toaster labels={{ name: "Notificações" }} id="x" className="y" />],
    ]),
  );
});
