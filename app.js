async function downloadProtectedPdf(pdfUrl, gradeTitle) {
  try {
    const tg = window.Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;
    
    const userName = user ? `${user.first_name} ${user.last_name || ''}`.trim() : "Guest Student";
    const userId = user ? user.id : "NoID";
    const timestamp = new Date().toISOString().split('T')[0];

    const response = await fetch(pdfUrl);
    if (!response.ok) throw new Error("HTTP error! status: " + response.status);
    const existingPdfBytes = await response.arrayBuffer();

    const { PDFDocument, rgb, degrees, StandardFonts } = PDFLib;
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();
    
    const watermarkText = `LICENSED TO: ${userName} (ID: ${userId}) - ${timestamp}`;

    // Loop through every page and draw watermarks at multiple positions
    for (const page of pages) {
      const { width, height } = page.getSize();
      
      // Draw at 3 different vertical heights to guarantee visibility
      [height * 0.25, height * 0.5, height * 0.75].forEach(yPos => {
        page.drawText(watermarkText, {
          x: width * 0.1,
          y: yPos,
          size: 16,
          font: font,
          color: rgb(0.9, 0.1, 0.1), // Bright Red
          opacity: 0.6,
          angle: degrees(30),
        });
      });
    }

    const modifiedPdfBytes = await pdfDoc.save();
    const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${gradeTitle}_Protected.pdf`;
    link.click();

  } catch (error) {
    console.error("Watermark error:", error);
    alert("Error caught: " + error.message);
  }
}
