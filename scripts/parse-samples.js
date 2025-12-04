const fs = require("fs");
const path = require("path");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf");

// Set workerSrc to CDN (not strictly required for Node extraction but kept)
pdfjsLib.GlobalWorkerOptions = pdfjsLib.GlobalWorkerOptions || {};
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

function toArrayBuffer(buf) {
  const ab = new ArrayBuffer(buf.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buf.length; ++i) view[i] = buf[i];
  return ab;
}

function normalizeTime(t) {
  if (!t) return null;
  const m = t.toString().match(/(\d{1,2}[:.]\d{2}(?::\d{2})?)/);
  if (!m) return null;
  const token = m[1].replace(".", ":");
  const parts = token.split(":");
  const hh = parts[0].padStart(2, "0");
  const mm = parts[1].padStart(2, "0");
  return `${hh}:${mm}`;
}

function normalizeDate(s) {
  if (!s) return null;
  s = s.toString();
  let m = s.match(
    /(\d{1,2})[\-\s](?:([A-Za-z]{3,})|([A-Za-z]+))[\-\s]?(\d{2,4})?/
  );
  if (m) {
    const day = m[1].padStart(2, "0");
    const mon = (m[2] || m[3] || "").toLowerCase();
    const monthMap = {
      jan: "01",
      feb: "02",
      mar: "03",
      apr: "04",
      may: "05",
      jun: "06",
      jul: "07",
      aug: "08",
      sep: "09",
      oct: "10",
      nov: "11",
      dec: "12",
      januari: "01",
      februari: "02",
      maret: "03",
      april: "04",
      mei: "05",
      juni: "06",
      juli: "07",
      agustus: "08",
      september: "09",
      oktober: "10",
      november: "11",
      desember: "12",
    };
    const month = monthMap[mon] || null;
    let year = m[4] || new Date().getFullYear();
    if (year.length === 2) year = "20" + year;
    if (month) return `${year}-${month}-${day}`;
  }
  // Try simple dd/mm/yyyy
  m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) {
    const day = m[1].padStart(2, "0");
    const month = m[2].padStart(2, "0");
    let year = m[3];
    if (year.length === 2) year = "20" + year;
    return `${year}-${month}-${day}`;
  }
  return null;
}

async function extractTextItems(filePath) {
  const buf = fs.readFileSync(filePath);
  const array = toArrayBuffer(buf);
  const loadingTask = pdfjsLib.getDocument({ data: array });
  const pdf = await loadingTask.promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const items = content.items.map((it) => {
      const transform = it.transform;
      const x = transform[4];
      const y = transform[5];
      return { str: it.str, x, y };
    });
    pages.push(items);
  }
  return pages;
}

function itemsToRows(items, yTolerance = 4) {
  const lines = [];
  for (const it of items) {
    if (!it.str || !it.str.trim()) continue;
    const y = Math.round(it.y);
    let line = lines.find((l) => Math.abs(l.y - y) <= yTolerance);
    if (!line) {
      line = { y, cells: [] };
      lines.push(line);
    }
    line.cells.push({ text: it.str.trim(), x: it.x, y });
  }
  lines.sort((a, b) => b.y - a.y);
  return lines.map((l) => l.cells.sort((a, b) => a.x - b.x));
}

async function parseFile(filePath) {
  const pagesItems = await extractTextItems(filePath);
  const rowsOut = [];
  for (const pageItems of pagesItems) {
    const rows = itemsToRows(pageItems, 4);
    for (const row of rows) {
      const rowText = row.map((c) => c.text).join(" ");
      const dateMatch = rowText.match(
        /(\d{1,2}[-\s][A-Za-z]{3,}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}\s+[A-Za-z]+(?:\s+\d{4})?)/
      );
      const timeMatches = rowText.match(/(\d{1,2}[:.]\d{2}(?::\d{2})?)/g);
      if (dateMatch) {
        const date = normalizeDate(dateMatch[0]);
        const checkin =
          timeMatches && timeMatches[0] ? normalizeTime(timeMatches[0]) : null;
        const checkout =
          timeMatches && timeMatches[1] ? normalizeTime(timeMatches[1]) : null;
        if (date) rowsOut.push({ date, checkin, checkout, raw: rowText });
      }
    }
  }
  return rowsOut;
}

async function main() {
  const samplesDir = path.join(__dirname, "..", "samples");
  if (!fs.existsSync(samplesDir)) {
    console.error(
      "Please create a folder named samples in the project root and put your PDFs there."
    );
    process.exit(1);
  }
  const files = fs
    .readdirSync(samplesDir)
    .filter((f) => f.toLowerCase().endsWith(".pdf"));
  if (files.length === 0) {
    console.error("No PDF files found in samples/. Add PDFs and run again.");
    process.exit(1);
  }
  for (const f of files) {
    const fp = path.join(samplesDir, f);
    console.log("Parsing", f);
    try {
      const parsed = await parseFile(fp);
      const outPath = path.join(
        samplesDir,
        `${path.basename(f, ".pdf")}.parsed.json`
      );
      fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2), "utf8");
      console.log("Wrote", outPath, "rows:", parsed.length);
    } catch (err) {
      console.error("Error parsing", f, err);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
