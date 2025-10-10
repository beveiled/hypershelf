import ExcelJS from "exceljs";

import {
  BODY_PT,
  FONT_FAMILY,
  HEADER_PT,
  HYPERSHELF_PNG,
  MAX_WIDTH_PX,
  PADDING_PX_X,
  PADDING_PX_Y,
  PX_PER_PT,
} from "./consts";

function setFont(
  ctx: CanvasRenderingContext2D,
  family: string,
  sizePt: number,
) {
  ctx.font = `${sizePt}pt "${family}"`;
}

function measureWidthPx(
  ctx: CanvasRenderingContext2D,
  family: string,
  sizePt: number,
  text: string,
): number {
  setFont(ctx, family, sizePt);
  const m = ctx.measureText(text);
  return m.width;
}

function zeroWidthPx(
  ctx: CanvasRenderingContext2D,
  family: string,
  sizePt: number,
): number {
  return measureWidthPx(ctx, family, sizePt, "0");
}

function lineHeightPx(
  ctx: CanvasRenderingContext2D,
  family: string,
  sizePt: number,
): number {
  setFont(ctx, family, sizePt);
  const m = ctx.measureText("Mg");
  const a =
    typeof m.actualBoundingBoxAscent === "number"
      ? m.actualBoundingBoxAscent
      : 0;
  const d =
    typeof m.actualBoundingBoxDescent === "number"
      ? m.actualBoundingBoxDescent
      : 0;
  return a + d;
}

function wrapHard(
  ctx: CanvasRenderingContext2D,
  family: string,
  sizePt: number,
  word: string,
  maxWidthPx: number,
): string[] {
  const lines: string[] = [];
  let start = 0;
  while (start < word.length) {
    let lo = 1;
    let hi = word.length - start;
    let best = 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const slice = word.slice(start, start + mid);
      if (measureWidthPx(ctx, family, sizePt, slice) <= maxWidthPx) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    lines.push(word.slice(start, start + best));
    start += best;
  }
  return lines;
}

function wrapSoft(
  ctx: CanvasRenderingContext2D,
  family: string,
  sizePt: number,
  text: string,
  maxWidthPx: number,
): string[] {
  const rawLines = String(text).split("\n");
  const out: string[] = [];
  for (const raw of rawLines) {
    const words = raw.split(/\s+/).filter((w) => w.length > 0);
    if (words.length === 0) {
      out.push("");
      continue;
    }
    let current = "";
    for (const w of words) {
      const candidate = current.length > 0 ? `${current} ${w}` : w;
      if (measureWidthPx(ctx, family, sizePt, candidate) <= maxWidthPx) {
        current = candidate;
      } else {
        if (current.length === 0) {
          const parts = wrapHard(ctx, family, sizePt, w, maxWidthPx);
          for (const p of parts.slice(0, parts.length - 1)) out.push(p);
          current = parts[parts.length - 1] ?? "";
        } else {
          out.push(current);
          if (measureWidthPx(ctx, family, sizePt, w) <= maxWidthPx) {
            current = w;
          } else {
            const parts = wrapHard(ctx, family, sizePt, w, maxWidthPx);
            for (const p of parts.slice(0, parts.length - 1)) out.push(p);
            current = parts[parts.length - 1] ?? "";
          }
        }
      }
    }
    out.push(current);
  }
  return out;
}

export async function buildXlsx(header: string[], data: string[][]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Хосты");

  const now = new Date();
  const months = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ];
  const day = now.getDate();
  const monthName = months[now.getMonth()];
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const dateString = `Данные экспортированы ${day} ${monthName} в ${hours}:${minutes}`;
  const noticeRow = sheet.addRow([dateString]);
  noticeRow.height = 15;
  noticeRow.eachCell((cell) => {
    cell.font = { name: "Arial", size: 10, italic: true };
    cell.alignment = {
      horizontal: "left",
      vertical: "middle",
      wrapText: true,
      indent: 17,
    };
  });
  noticeRow.commit();

  const headerRow = sheet.addRow(header);
  sheet.mergeCells(1, 1, 1, header.length);
  const borderSide: ExcelJS.Border = {
    style: "thin",
    color: { argb: "FF999999" },
  };
  headerRow.eachCell((cell) => {
    cell.font = { name: "Arial", size: 11, bold: true };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    cell.border = { bottom: borderSide };
  });
  headerRow.commit();

  for (const rowData of data) {
    const row = sheet.addRow(rowData);
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { name: "Arial", size: 10 };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      cell.border = { left: borderSide, right: borderSide };
    });
    row.commit();
  }

  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Failed to create canvas context");

  sheet.columns.forEach((column) => {
    let maxPx = 0;

    column.eachCell?.({ includeEmpty: true }, (cell, rowNumber) => {
      if (rowNumber === 1) return;
      const sizePt = rowNumber === 2 ? HEADER_PT : BODY_PT;
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      const v = String(cell.value ?? "");
      for (const line of v.split("\n")) {
        const w = measureWidthPx(ctx, FONT_FAMILY, sizePt, line);
        if (w > maxPx) maxPx = w;
      }
    });
    const finalPx = Math.min(maxPx + PADDING_PX_X * 2, MAX_WIDTH_PX);
    const charPx = zeroWidthPx(ctx, FONT_FAMILY, BODY_PT);
    column.width = finalPx / charPx;
  });

  sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    let maxLines = 1;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const wChars = sheet.getColumn(colNumber).width ?? 10;
      const charPx = zeroWidthPx(ctx, FONT_FAMILY, BODY_PT);
      const contentPx = wChars * charPx - PADDING_PX_X * 2;
      const sizePt = rowNumber === 2 ? HEADER_PT : BODY_PT;
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      const v = String(cell.value ?? "");
      const wrapped = wrapSoft(
        ctx,
        FONT_FAMILY,
        sizePt,
        v,
        contentPx > 0 ? contentPx : 0,
      );
      if (wrapped.length > maxLines) maxLines = wrapped.length;
    });
    const lhPx = lineHeightPx(
      ctx,
      FONT_FAMILY,
      rowNumber === 2 ? HEADER_PT : BODY_PT,
    );
    const hPx = maxLines * lhPx + PADDING_PX_Y * 2;
    row.height = hPx / PX_PER_PT;
  });

  const imageId = workbook.addImage({
    base64: HYPERSHELF_PNG,
    extension: "png",
  });
  sheet.addImage(imageId, {
    tl: { col: 0, row: 0 },
    ext: { width: 129, height: 27 },
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}
