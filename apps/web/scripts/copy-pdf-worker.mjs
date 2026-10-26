// Copies the pdf.js worker that react-pdf depends on into public/, so the viewer
// always loads a worker matching its pdf.js version (and needs no CDN).
import { copyFileSync, mkdirSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const require = createRequire(import.meta.url)
const reactPdf = dirname(require.resolve("react-pdf/package.json"))
const worker = createRequire(join(reactPdf, "package.json")).resolve("pdfjs-dist/build/pdf.worker.min.mjs")
const out = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "pdf.worker.min.mjs")

mkdirSync(dirname(out), { recursive: true })
copyFileSync(worker, out)
console.log(`pdf.js worker → ${out}`)
