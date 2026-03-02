/**
 * Client-side directory export (Excel and PDF).
 * Uses the same column layout as the old downloadDirectory function.
 */

import type { UnitListItem } from "@/lib/api/units";

const COLUMN_TITLES = [
  "Unit #",
  "Husband First",
  "Wife First",
  "Last Name",
  "Address",
  "City",
  "State",
  "Zip",
  "Husband Phone",
  "Wife Phone",
  "Husband Email",
  "Wife Email",
  "Notes",
  "Children",
] as const;

function listItemToRow(item: UnitListItem): Record<string, string> {
  const { unit, husband, wife, children } = item;
  const lastName = husband?.last_name ?? wife?.last_name ?? "";
  const childrenStr =
    children?.length > 0
      ? children.map((c) => `${c.name} (${c.age})`).join(", ")
      : "";
  return {
    [COLUMN_TITLES[0]]: unit.unit_number ?? "",
    [COLUMN_TITLES[1]]: husband?.husband_first ?? "",
    [COLUMN_TITLES[2]]: wife?.wife_first ?? "",
    [COLUMN_TITLES[3]]: lastName,
    [COLUMN_TITLES[4]]: unit.address ?? "",
    [COLUMN_TITLES[5]]: unit.city ?? "",
    [COLUMN_TITLES[6]]: unit.state ?? "",
    [COLUMN_TITLES[7]]: unit.zip ?? "",
    [COLUMN_TITLES[8]]: husband?.husband_phone ?? "",
    [COLUMN_TITLES[9]]: wife?.wife_phone ?? "",
    [COLUMN_TITLES[10]]: husband?.husband_email ?? "",
    [COLUMN_TITLES[11]]: wife?.wife_email ?? "",
    [COLUMN_TITLES[12]]: unit.notes ?? "",
    [COLUMN_TITLES[13]]: childrenStr,
  };
}

export function exportDirectoryToExcel(
  items: UnitListItem[],
  filename = "directory.xlsx"
): Promise<void> {
  const rows = items.map(listItemToRow);
  return import("xlsx").then((XLSX) => {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Directory");
    const cols = [
      { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 },
      { wch: 15 }, { wch: 8 }, { wch: 10 }, { wch: 15 }, { wch: 15 },
      { wch: 25 }, { wch: 25 }, { wch: 20 }, { wch: 30 },
    ];
    worksheet["!cols"] = cols;
    XLSX.writeFile(workbook, filename);
  });
}

const PDF_HEADERS = [
  "Unit",
  "Husband",
  "Wife",
  "Last Name",
  "Phone",
  "Email",
  "Address",
  "City",
  "State",
  "Zip",
];
const PDF_COLUMN_X = [12, 22, 34, 48, 62, 88, 110, 135, 148, 160];

export function exportDirectoryToPdf(
  items: UnitListItem[],
  title = "Contact Directory",
  filename = "directory.pdf"
): Promise<void> {
  return import("jspdf").then(({ jsPDF }) => {
    const doc = new jsPDF({ orientation: "l" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 15;

    doc.setFontSize(14);
    doc.text(title, pageWidth / 2, y, { align: "center" });
    y += 10;
    doc.setFontSize(9);
    doc.text(
      `Generated: ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      y,
      { align: "center" }
    );
    y += 8;

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    PDF_HEADERS.forEach((header, i) => {
      doc.text(header, PDF_COLUMN_X[i], y);
    });
    y += 6;
    doc.setDrawColor(200);
    doc.line(10, y, pageWidth - 10, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);

    items.forEach((item) => {
      const { unit, husband, wife } = item;
      const phone = husband?.husband_phone || wife?.wife_phone || "";
      const email = husband?.husband_email || wife?.wife_email || "";

      if (y > pageHeight - 15) {
        doc.addPage();
        y = 15;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        PDF_HEADERS.forEach((header, i) => {
          doc.text(header, PDF_COLUMN_X[i], y);
        });
        y += 6;
        doc.setDrawColor(200);
        doc.line(10, y, pageWidth - 10, y);
        y += 4;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
      }

      doc.text(String(unit.unit_number ?? ""), PDF_COLUMN_X[0], y);
      doc.text(husband?.husband_first ?? "", PDF_COLUMN_X[1], y);
      doc.text(wife?.wife_first ?? "", PDF_COLUMN_X[2], y);
      doc.text(husband?.last_name ?? wife?.last_name ?? "", PDF_COLUMN_X[3], y);
      doc.text(phone, PDF_COLUMN_X[4], y);
      doc.text(email, PDF_COLUMN_X[5], y);
      doc.text(unit.address ?? "", PDF_COLUMN_X[6], y);
      doc.text(unit.city ?? "", PDF_COLUMN_X[7], y);
      doc.text(unit.state ?? "", PDF_COLUMN_X[8], y);
      doc.text(unit.zip ?? "", PDF_COLUMN_X[9], y);
      y += 5;
    });

    doc.save(filename);
  });
}

