/**
 * PDF Generator Utility
 * Generates valid standard PDF-1.4 binary data buffers directly in JavaScript.
 * Ensures the app works 100% offline and standalone without CORS issues or external PDF hosts.
 */

function createPdfDocument(title, subject, pagesContent) {
  // Simple, robust PDF 1.4 generator in pure JS
  const objects = [];
  
  function addObject(content) {
    const objNum = objects.length + 1;
    objects.push({ num: objNum, content });
    return objNum;
  }

  // Placeholder for catalog and pages root
  const catalogObjNum = 1;
  const pagesObjNum = 2;
  const fontObjNum = 3;
  
  objects.push({ num: catalogObjNum, content: `<< /Type /Catalog /Pages ${pagesObjNum} 0 R >>` });
  
  // We'll update pages object once we know all page object numbers
  const pageObjectNumbers = [];
  objects.push({ num: pagesObjNum, content: "" }); // placeholder at index 1

  // Standard Helvetica Font object
  objects.push({
    num: fontObjNum,
    content: `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`
  });
  const regularFontObjNum = addObject(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`);

  // Build each page
  pagesContent.forEach((pageData, index) => {
    // Generate page stream
    let streamOps = [];
    
    // Header Bar
    streamOps.push("0.12 0.22 0.45 rg"); // Indigo color
    streamOps.push("36 730 540 40 re f"); // Header box
    
    // Header Text
    streamOps.push("BT");
    streamOps.push("/F1 15 Tf");
    streamOps.push("1 1 1 rg"); // White text
    streamOps.push(`50 745 Td`);
    streamOps.push(`(${escapePdfString(title.toUpperCase())}) Tj`);
    streamOps.push("ET");

    // Subtitle & Subject Badge
    streamOps.push("BT");
    streamOps.push("/F2 10 Tf");
    streamOps.push("0.4 0.45 0.5 rg");
    streamOps.push(`50 710 Td`);
    streamOps.push(`(Subject: ${escapePdfString(subject)} | Page ${index + 1} of ${pagesContent.length} | Confidential Exam Prep) Tj`);
    streamOps.push("ET");

    // Divider line
    streamOps.push("0.85 0.88 0.92 RG");
    streamOps.push("1 w");
    streamOps.push("50 700 m 562 700 l S");

    let currentY = 670;

    // Render sections
    pageData.sections.forEach(section => {
      // Section Heading
      streamOps.push("BT");
      streamOps.push("/F1 12 Tf");
      streamOps.push("0.1 0.15 0.3 rg");
      streamOps.push(`50 ${currentY} Td`);
      streamOps.push(`(${escapePdfString(section.heading)}) Tj`);
      streamOps.push("ET");
      currentY -= 18;

      // Section Content Lines
      section.lines.forEach(line => {
        streamOps.push("BT");
        streamOps.push("/F2 10 Tf");
        streamOps.push("0.2 0.22 0.26 rg");
        streamOps.push(`50 ${currentY} Td`);
        streamOps.push(`(${escapePdfString(line)}) Tj`);
        streamOps.push("ET");
        currentY -= 15;
      });

      currentY -= 12; // spacing
    });

    // Footer
    streamOps.push("0.9 0.92 0.95 RG");
    streamOps.push("50 50 m 562 50 l S");
    streamOps.push("BT");
    streamOps.push("/F2 8 Tf");
    streamOps.push("0.5 0.55 0.6 rg");
    streamOps.push(`50 36 Td`);
    streamOps.push(`(EduGram Protected Study Document - Unauthorized Distribution Prohibited) Tj`);
    streamOps.push("510 36 Td");
    streamOps.push(`(Page ${index + 1}) Tj`);
    streamOps.push("ET");

    const streamContent = streamOps.join("\n");
    const streamLen = streamContent.length;

    const streamObjNum = addObject(`<< /Length ${streamLen} >>\nstream\n${streamContent}\nendstream`);
    
    // Page Object
    const pageObjNum = addObject(
      `<< /Type /Page /Parent ${pagesObjNum} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObjNum} 0 R /F2 ${regularFontObjNum} 0 R >> >> /Contents ${streamObjNum} 0 R >>`
    );
    pageObjectNumbers.push(pageObjNum);
  });

  // Update pages object
  objects[pagesObjNum - 1].content = `<< /Type /Pages /Kids [${pageObjectNumbers.map(n => `${n} 0 R`).join(" ")}] /Count ${pageObjectNumbers.length} >>`;

  // Assemble full PDF
  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [];

  objects.forEach(obj => {
    offsets.push(pdf.length);
    pdf += `${obj.num} 0 obj\n${obj.content}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += "xref\n";
  pdf += `0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  offsets.forEach(offset => {
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  });

  pdf += "trailer\n";
  pdf += `<< /Size ${objects.length + 1} /Root ${catalogObjNum} 0 R >>\n`;
  pdf += "startxref\n";
  pdf += `${xrefOffset}\n`;
  pdf += "%%EOF\n";

  return pdf;
}

function escapePdfString(str) {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, "?");
}

if (typeof window !== "undefined") {
  window.createPdfDocument = createPdfDocument;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { createPdfDocument };
}
