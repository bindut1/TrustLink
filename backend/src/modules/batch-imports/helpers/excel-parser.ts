import * as XLSX from 'xlsx';

export interface ParsedRow {
  /** 1-based spreadsheet row number (header is row 1, first data row is 2). */
  rowNumber: number;
  values: Record<string, unknown>;
}

/**
 * Read the first worksheet and return rows keyed by header name.
 * Empty rows are skipped. Header keys are trimmed.
 */
export function parseExcelFile(filePath: string): ParsedRow[] {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];

  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: true,
  });

  const rows: ParsedRow[] = [];
  raw.forEach((rawRow, idx) => {
    const trimmed: Record<string, unknown> = {};
    let hasValue = false;
    for (const [key, value] of Object.entries(rawRow)) {
      const cleanKey = String(key).trim();
      if (!cleanKey) continue;
      trimmed[cleanKey] = value;
      if (value !== null && value !== undefined && value !== '') hasValue = true;
    }
    if (!hasValue) return;
    rows.push({ rowNumber: idx + 2, values: trimmed });
  });

  return rows;
}
