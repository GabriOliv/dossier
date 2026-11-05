// Removes dist/ so a build never ships files left over from an older one.
import { rmSync } from "node:fs";

rmSync(new URL("../dist", import.meta.url), { recursive: true, force: true });
