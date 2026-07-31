import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "D:/Web Project/korezi 2.0/korezi-store/outputs/category-bulk-template";
const workbook = Workbook.create();

const upload = workbook.worksheets.add("Category Upload");
const instructions = workbook.worksheets.add("Instructions");

const headers = ["Main Category", "Sub Category", "3rd Category", "Image", "Description", "Sort Order"];
const rows = [
  ["Skin Care", "Serum & Treatment", "Serum", "https://example.com/skincare.jpg", "All skincare products", 1],
  ["Skin Care", "Serum & Treatment", "Ampoules", "https://example.com/skincare.jpg", "All skincare products", 1],
  ["Skin Care", "Serum & Treatment", "Essence", "https://example.com/skincare.jpg", "All skincare products", 1],
  ["Skin Care", "Moisturizer", "Moisturizing Cream", "https://example.com/skincare.jpg", "All skincare products", 1],
  ["Skin Care", "Moisturizer", "Face Oil", "https://example.com/skincare.jpg", "All skincare products", 1],
  ["Skin Care", "Moisturizer", "Soothing Gel", "https://example.com/skincare.jpg", "All skincare products", 1],
  ["Skin Care", "Cleanser", "", "https://example.com/skincare.jpg", "All skincare products", 1],
  ["Skin Care", "Face Mask", "", "https://example.com/skincare.jpg", "All skincare products", 1],
  ["Mack Up", "Face", "Primers", "https://example.com/makeup.jpg", "Makeup products", 2],
  ["Mack Up", "Face", "Foundation", "https://example.com/makeup.jpg", "Makeup products", 2],
  ["Mack Up", "Eyes", "Eyeliner", "https://example.com/makeup.jpg", "Makeup products", 2],
  ["Mack Up", "Eyes", "Mascara", "https://example.com/makeup.jpg", "Makeup products", 2],
  ["Hair Care", "Shampoo", "", "https://example.com/hair.jpg", "Hair care products", 3],
  ["Hair Care", "Conditioner", "", "https://example.com/hair.jpg", "Hair care products", 3],
  ["Bath & Body Care", "Body Wash", "", "https://example.com/bath-body.jpg", "Bath and body products", 4],
  ["Bath & Body Care", "Body Lotion", "", "https://example.com/bath-body.jpg", "Bath and body products", 4],
];

upload.getRange("A1:F1").values = [headers];
upload.getRange(`A2:F${rows.length + 1}`).values = rows;
upload.freezePanes.freezeRows(1);
upload.showGridLines = false;

const title = upload.getRange("A1:F1");
title.format.fill = { color: "#FCE7E8" };
title.format.font = { color: "#111111", bold: true };
title.format.rowHeightPx = 32;
title.format.borders = { preset: "outside", style: "thin", color: "#BE171F" };

const dataRange = upload.getRange(`A2:F${rows.length + 1}`);
dataRange.format.borders = { preset: "inside", style: "thin", color: "#E5E7EB" };
dataRange.format.font = { color: "#111827" };
upload.getRange("A:A").format.columnWidthPx = 150;
upload.getRange("B:B").format.columnWidthPx = 190;
upload.getRange("C:C").format.columnWidthPx = 190;
upload.getRange("D:D").format.columnWidthPx = 260;
upload.getRange("E:E").format.columnWidthPx = 220;
upload.getRange("F:F").format.columnWidthPx = 90;
upload.getRange("D:E").format.wrapText = true;
upload.getRange("F:F").format.horizontalAlignment = "center";
upload.getRange("F2:F200").format.numberFormat = [["0"]];

const noteRange = upload.getRange("H1:K8");
noteRange.values = [
  ["Rules", "", "", ""],
  ["Repeat Main Category on every row.", "", "", ""],
  ["Repeat Sub Category on every row.", "", "", ""],
  ["Leave 3rd Category blank if there is no third level.", "", "", ""],
  ["Image should be a public URL for the main category image.", "", "", ""],
  ["Sort Order controls frontend order: 1 shows first.", "", "", ""],
  ["Do not merge cells before upload.", "", "", ""],
  ["Keep header names exactly as shown.", "", "", ""],
];
upload.getRange("H1:K1").merge();
upload.getRange("H2:K8").merge(true);
upload.getRange("H1:K8").format.fill = { color: "#FFF4F4" };
upload.getRange("H1:K8").format.borders = { preset: "outside", style: "thin", color: "#FCA5A5" };
upload.getRange("H1").format.font = { bold: true, color: "#BE171F" };
upload.getRange("H:K").format.columnWidthPx = 110;

instructions.showGridLines = false;
instructions.getRange("A1:E1").merge();
instructions.getRange("A1").values = [["Korezi Bulk Category Upload Template"]];
instructions.getRange("A1").format.font = { bold: true, size: 18, color: "#BE171F" };
instructions.getRange("A1").format.rowHeightPx = 36;

instructions.getRange("A3:E10").values = [
  ["Column", "Required", "Example", "How it maps", "Notes"],
  ["Main Category", "Yes", "Skin Care", "Category.name", "Repeat it on every row."],
  ["Sub Category", "Optional", "Moisturizer", "Category.subcategories[].name", "Repeat for each 3rd category row."],
  ["3rd Category", "Optional", "Face Oil", "Subcategory.children[].name", "Leave blank when not needed."],
  ["Image", "Optional", "https://example.com/skincare.jpg", "Category.image", "Use public URL."],
  ["Description", "Optional", "All skincare products", "Category.description", "Internal/storefront note."],
  ["Sort Order", "Optional", "1", "Category.sortOrder", "Lower number shows first."],
  ["", "", "", "", ""],
];
instructions.getRange("A3:E3").format.fill = { color: "#111111" };
instructions.getRange("A3:E3").format.font = { color: "#FFFFFF", bold: true };
instructions.getRange("A3:E10").format.borders = { preset: "inside", style: "thin", color: "#E5E7EB" };
instructions.getRange("A:A").format.columnWidthPx = 145;
instructions.getRange("B:B").format.columnWidthPx = 95;
instructions.getRange("C:C").format.columnWidthPx = 180;
instructions.getRange("D:D").format.columnWidthPx = 210;
instructions.getRange("E:E").format.columnWidthPx = 260;
instructions.getRange("A3:E10").format.wrapText = true;

instructions.getRange("A12:E17").values = [
  ["Recommended Google Sheet workflow", "", "", "", ""],
  ["1. Upload/open this XLSX in Google Sheets.", "", "", "", ""],
  ["2. Replace demo rows with your categories.", "", "", "", ""],
  ["3. Do not leave Main Category blank on child rows.", "", "", "", ""],
  ["4. Keep image links public if you want category images.", "", "", "", ""],
  ["5. Export/share as CSV when using the admin importer.", "", "", "", ""],
];
instructions.getRange("A12:E12").merge();
instructions.getRange("A13:E17").merge(true);
instructions.getRange("A12:E17").format.fill = { color: "#F9FAFB" };
instructions.getRange("A12").format.font = { bold: true, color: "#111827" };
instructions.getRange("A12:E17").format.borders = { preset: "outside", style: "thin", color: "#E5E7EB" };

await fs.mkdir(outputDir, { recursive: true });
const preview = await workbook.render({ sheetName: "Category Upload", range: "A1:K18", scale: 1, format: "png" });
await fs.writeFile(path.join(outputDir, "category-upload-template-preview.png"), new Uint8Array(await preview.arrayBuffer()));

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 50 },
  summary: "formula error scan",
});
console.log(errors.ndjson);

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(path.join(outputDir, "korezi-category-bulk-upload-template.xlsx"));
console.log(path.join(outputDir, "korezi-category-bulk-upload-template.xlsx"));
