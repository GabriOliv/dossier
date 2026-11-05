import { execFile, execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { expect, test } from "@playwright/test";

// npm must run asynchronously: the HTTP server lives in this process.
const run = promisify(execFile);

let server: Server;
let base: string;
let tarball: string;

test.beforeAll(async () => {
  const dir = mkdtempSync(join(tmpdir(), "dossier-pack-"));
  execFileSync("npm", ["pack", "--pack-destination", dir], { stdio: "ignore" });
  tarball = join(dir, readdirSync(dir).find((f) => f.endsWith(".tgz"))!);
  const body = readFileSync(tarball);
  server = createServer((req, res) => {
    if (req.url === "/gabrioliv-dossier.tgz") res.end(body);
    else res.writeHead(404).end();
  });
  await new Promise<void>((ok) => server.listen(0, "127.0.0.1", ok));
  const address = server.address();
  base = `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`;
});

test.afterAll(() => new Promise<void>((ok) => server.close(() => ok())));

async function verify(url: string, tgz: string) {
  try {
    const r = await run("node", ["scripts/release/verify-install.mjs", url, tgz]);
    return { status: 0, out: r.stdout + r.stderr };
  } catch (e) {
    const err = e as { code: number; stdout: string; stderr: string };
    return { status: err.code, out: err.stdout + err.stderr };
  }
}

test("REL-12 the URL that serves the tested tarball passes the install check", async () => {
  const r = await verify(`${base}/gabrioliv-dossier.tgz`, tarball);
  expect(r.status, r.out).toBe(0);
});

test("REL-12 a different tarball behind the URL fails the install check", async () => {
  const other = join(mkdtempSync(join(tmpdir(), "dossier-other-")), "other.tgz");
  writeFileSync(other, Buffer.concat([readFileSync(tarball), Buffer.from("x")]));
  const r = await verify(`${base}/gabrioliv-dossier.tgz`, other);
  expect(r.status).toBe(1);
  expect(r.out).toContain("is not the tested one");
});

test("REL-12 a URL that answers 404 fails the install check", async () => {
  const r = await verify(`${base}/missing.tgz`, tarball);
  expect(r.status).toBe(1);
  expect(r.out).toContain("failed");
});
