async function downloadProtectedPdf(pdfUrl, gradeTitle) {
  try {
    const tg = window.Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;
    
    const userName = user ? `${user.first_name} ${user.last_name || ''}`.trim() : "Guest Student";
    const userId = user ? user.id : "NoID";
    const timestamp = new Date().toISOString().split('T')[0];

    console.log("Fetching PDF from URL:", pdfUrl);
    
    // 1. Fetch PDF with explicit error catching
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF. Status: ${response.status} ${response.statusText}`);
    }
    
    const existingPdfBytes = await response.arrayBuffer();
    console.log("PDF fetched successfully. Size:", existingPdfBytes.byteLength);

    // 2. Load PDF Document using pdf-lib
    const { PDFDocument, rgb, degrees, StandardFonts } = PDFLib;
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();
    
    const watermarkText = `LICENSED TO: ${userName} (ID: ${userId}) - ${timestamp}`;
    console.log("Applying watermark text:", watermarkText);

    // 3. Draw Watermark on every page
    for (const page of pages) {
      const { width, height } = page.getSize();
      
      // Draw a bright red warning banner across the center
      page.drawRectangle({
        x: width * 0.1,
        y: height * 0.5,
        width: width * 0.8,
        height: 30,
        color: rgb(1, 0, 0),
        opacity: 0.8,
      });

      page.drawText(watermarkText, {
        x: (width * 0.1) + 10,
        y: (height * 0.5) + 10,
        size: 11,
        font: font,
        color: rgb(1, 1, 1),
      });
    }

    // 4. Save and trigger download
    const modifiedPdfBytes = await pdfDoc.save();
    console.log("PDF modified successfully. Generating download blob...");
    
    const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${gradeTitle}_Protected.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert("Success! Watermarked PDF downloaded.");

  } catch (error) {
    console.error("Critical watermarking error:", error);
    alert("Watermark Failed: " + error.message);
  }
}
