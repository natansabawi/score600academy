async function downloadProtectedPdf(pdfUrl, gradeTitle) {
  try {
    // 1. Get Telegram User Data
    const tg = window.Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;
    
    const userName = user ? `${user.first_name} ${user.last_name || ''}`.trim() : "Guest Student";
    const userId = user ? user.id : "NoID";
    const timestamp = new Date().toISOString().split('T')[0];

    alert("Starting download for: " + userName + " (ID: " + userId + ")");

    // 2. Fetch the PDF
    const response = await fetch(pdfUrl);
    if (!response.ok) throw new Error("HTTP error! status: " + response.status);
    const existingPdfBytes = await response.arrayBuffer();

    // 3. Load PDF Document using pdf-lib
    const { PDFDocument, rgb, degrees, StandardFonts } = PDFLib;
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();
    
    const watermarkText = `Licensed to: ${userName} (ID: ${userId}) - ${timestamp}`;

    // 4. Draw Watermark on each page
    for (const page of pages) {
      const { width, height } = page.getSize();
      
      // Center diagonal watermark
      page.drawText(watermarkText, {
        x: width / 6,
        y: height / 2,
        size: 14,
        font: font,
        color: rgb(0.8, 0, 0), // Bright Red temporarily so it's impossible to miss!
        opacity: 0.5,
        angle: degrees(35),
      });
    }

    // 5. Save and Download
    const modifiedPdfBytes = await pdfDoc.save();
    const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${gradeTitle}_Protected.pdf`;
    link.click();
    
    alert("Watermark applied successfully!");

  } catch (error) {
    console.error("Watermark error:", error);
    alert("Error caught: " + error.message);
  }
}
