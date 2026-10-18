// Function to download and watermark PDFs with student Telegram details
async function downloadProtectedPdf(pdfUrl, gradeTitle) {
  // 1. Get Telegram User Data automatically from the Mini App session
  const tg = window.Telegram?.WebApp;
  const user = tg?.initDataUnsafe?.user;
  
  const userName = user ? `${user.first_name} ${user.last_name || ''}`.trim() : "Score600Academy Student";
  const userId = user ? user.id : "Guest";
  const timestamp = new Date().toISOString().split('T')[0];

  // Watermark text containing their unique details
  const watermarkText = `Licensed to: ${userName} (ID: ${userId}) - ${timestamp}`;

  try {
    console.log("Fetching PDF from:", pdfUrl);
    // 2. Fetch the original PDF
    const existingPdfBytes = await fetch(pdfUrl).then(res => {
      if (!res.ok) throw new Error(`Failed to fetch PDF: ${res.statusText}`);
      return res.arrayBuffer();
    });

    // 3. Load the PDF using pdf-lib
    const { PDFDocument, rgb, degrees, StandardFonts } = PDFLib;
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
    // Embed a standard font so text is guaranteed to render
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();

    // 4. Loop through every page and embed the diagonal security watermark & footer
    for (const page of pages) {
      const { width, height } = page.getSize();
      
      // Diagonal semi-transparent watermark across the center
      page.drawText(watermarkText, {
        x: width / 6,
        y: height / 2,
        size: 14,
        font: font,
        color: rgb(0.4, 0.4, 0.4), // Darker gray for better visibility
        opacity: 0.4,
        angle: degrees(35),
      });

      // Bottom footer disclaimer
      page.drawText(`Score600Academy - Exclusive Copy for ${userName} (Telegram ID: ${userId})`, {
        x: 40,
        y: 20,
        size: 8,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
      });
    }

    // 5. Save the modified PDF and trigger browser download
    const modifiedPdfBytes = await pdfDoc.save();
    const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${gradeTitle}_Score600Academy.pdf`;
    link.click();
    console.log("PDF successfully watermarked and downloaded!");

  } catch (error) {
    console.error("Error generating protected PDF:", error);
    alert("Could not watermark PDF. Error: " + error.message);
  }
}
