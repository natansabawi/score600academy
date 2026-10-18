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

    for (const page of pages) {
      const { width, height } = page.getSize();
      
      // 1. Draw a solid red background box near the top center so it's guaranteed to be seen
      page.drawRectangle({
        x: width * 0.1,
        y: height * 0.8,
        width: width * 0.8,
        height: 40,
        color: rgb(1, 0, 0), // Solid red
        opacity: 0.7,
      });

      // 2. Draw text inside/over the red box
      page.drawText(watermarkText, {
        x: (width * 0.1) + 10,
        y: (height * 0.8) + 15,
        size: 12,
        font: font,
        color: rgb(1, 1, 1), // White text on red background
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
