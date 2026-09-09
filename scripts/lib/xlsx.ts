import { readFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";

/**
 * Minimal read-only .xlsx reader. An xlsx is a zip of XML parts, and Node ships
 * both zlib and enough string handling to read one, so this avoids pulling a
 * spreadsheet library (and its dependency tree) in for a single local import.
 */

type Entry = { name: string; method: number; compSize: number; localOffset: number };

function unzip(buf: Buffer): Map<string, Buffer> {
  // End of central directory: scan back from the tail for its signature.
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 22 - 0xffff; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("not a zip file (no end-of-central-directory record)");

  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);

  const entries: Entry[] = [];
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("bad central directory entry");
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    entries.push({ name, method, compSize, localOffset });
    p += 46 + nameLen + extraLen + commentLen;
  }

  const files = new Map<string, Buffer>();
  for (const e of entries) {
    const lo = e.localOffset;
    if (buf.readUInt32LE(lo) !== 0x04034b50) throw new Error(`bad local header: ${e.name}`);
    const nameLen = buf.readUInt16LE(lo + 26);
    const extraLen = buf.readUInt16LE(lo + 28);
    const start = lo + 30 + nameLen + extraLen;
    const raw = buf.subarray(start, start + e.compSize);
    files.set(e.name, e.method === 0 ? raw : inflateRawSync(raw));
  }
  return files;
}

const XML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
};

function decode(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&(amp|lt|gt|quot|apos);/g, (m) => XML_ENTITIES[m]);
}

/** Concatenates every <t> in a fragment, which is how shared strings with runs work. */
function textOf(fragment: string): string {
  const out: string[] = [];
  const re = /<t[^>]*>([\s\S]*?)<\/t>|<t[^>]*\/>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(fragment))) out.push(decode(m[1] ?? ""));
  return out.join("");
}

export type Cell = { ref: string; col: string; row: number; value: string | null };
export type Sheet = { name: string; rows: Map<number, Map<string, string>> };

export type Workbook = {
  sheets: Map<string, Sheet>;
  /** Cell value as a string, or "" when empty. */
  get(sheet: string, ref: string): string;
  rowNumbers(sheet: string): number[];
};

export function readWorkbook(path: string): Workbook {
  const files = unzip(readFileSync(path));

  const ssXml = files.get("xl/sharedStrings.xml")?.toString("utf8") ?? "";
  const shared: string[] = [];
  {
    const re = /<si>([\s\S]*?)<\/si>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(ssXml))) shared.push(textOf(m[1]));
  }

  // Map sheet name -> part path via workbook.xml + its rels.
  const wbXml = files.get("xl/workbook.xml")!.toString("utf8");
  const relsXml = files.get("xl/_rels/workbook.xml.rels")!.toString("utf8");

  const relTarget = new Map<string, string>();
  {
    const re = /<Relationship\b[^>]*\/>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(relsXml))) {
      const id = /Id="([^"]+)"/.exec(m[0])?.[1];
      const target = /Target="([^"]+)"/.exec(m[0])?.[1];
      if (id && target) relTarget.set(id, target.replace(/^\/?xl\//, "").replace(/^\//, ""));
    }
  }

  const sheets = new Map<string, Sheet>();
  {
    const re = /<sheet\b[^>]*\/>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(wbXml))) {
      const name = decode(/name="([^"]*)"/.exec(m[0])?.[1] ?? "");
      const rid = /r:id="([^"]+)"/.exec(m[0])?.[1] ?? "";
      const target = relTarget.get(rid);
      if (!target) continue;
      const xml = files.get(`xl/${target}`)?.toString("utf8");
      if (!xml) continue;

      const rows = new Map<number, Map<string, string>>();
      const rowRe = /<row\b[^>]*?r="(\d+)"[^>]*?>([\s\S]*?)<\/row>/g;
      let rm: RegExpExecArray | null;
      while ((rm = rowRe.exec(xml))) {
        const rowNum = Number(rm[1]);
        const cells = new Map<string, string>();
        // Lazy: a greedy [^>]* would eat the "/" of a self-closing <c/> and then
          // swallow the following cell's contents.
          const cellRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
        let cm: RegExpExecArray | null;
        while ((cm = cellRe.exec(rm[2]))) {
          const attrs = cm[1];
          const inner = cm[2] ?? "";
          const ref = /r="([A-Z]+)\d+"/.exec(attrs)?.[1];
          if (!ref) continue;
          const type = /t="([^"]+)"/.exec(attrs)?.[1];
          let value: string;
          if (type === "s") {
            const idx = /<v>([\s\S]*?)<\/v>/.exec(inner)?.[1];
            value = idx == null ? "" : (shared[Number(idx)] ?? "");
          } else if (type === "inlineStr") {
            value = textOf(inner);
          } else {
            value = decode(/<v>([\s\S]*?)<\/v>/.exec(inner)?.[1] ?? "");
          }
          if (value !== "") cells.set(ref, value);
        }
        if (cells.size) rows.set(rowNum, cells);
      }
      sheets.set(name, { name, rows });
    }
  }

  return {
    sheets,
    get(sheet: string, ref: string): string {
      const m = /^([A-Z]+)(\d+)$/.exec(ref);
      if (!m) return "";
      return sheets.get(sheet)?.rows.get(Number(m[2]))?.get(m[1]) ?? "";
    },
    rowNumbers(sheet: string): number[] {
      return [...(sheets.get(sheet)?.rows.keys() ?? [])].sort((a, b) => a - b);
    },
  };
}

/** Excel serial date -> ISO yyyy-mm-dd. Excel's epoch is 1899-12-30. */
export function serialToISO(serial: number): string {
  const ms = Date.UTC(1899, 11, 30) + Math.round(serial) * 86400000;
  return new Date(ms).toISOString().slice(0, 10);
}
