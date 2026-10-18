// Function to download and watermark PDFs with student Telegram details
async function downloadProtectedPdf(pdfUrl, gradeTitle) {
  // 1. Get Telegram User Data automatically from the Mini App session
  const tg = window.Telegram?.WebApp;
  const user = tg?.initDataUnsafe?.user;
  
  const userName = user ? `${user.first_name} ${user.last_name || ''}`.trim() : "Score600Academy Student";
  const userId = user ? user.id : "Guest";
  const timestamp = new Date().toISOString().split('T')[0];

  // Watermark text containing their unique details to prevent sharing
  const watermarkText = `Licensed to: ${userName} (ID: ${userId}) - ${timestamp}`;

  try {
    // 2. Fetch the original PDF from your storage/server/Vercel public folder
    const existingPdfBytes = await fetch(pdfUrl).then(res => {
      if (!res.ok) throw new Error("Failed to fetch PDF");
      return res.arrayBuffer();
    });

    // 3. Load the PDF using pdf-lib
    const { PDFDocument, rgb, degrees } = PDFLib;
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();

    // 4. Loop through every page and embed the diagonal security watermark & footer
    for (const page of pages) {
      const { width, height } = page.getSize();
      
      // Diagonal semi-transparent watermark across the center
      page.drawText(watermarkText, {
        x: width / 4,
        y: height / 2,
        size: 16,
        color: rgb(0.5, 0.5, 0.5), // Subtle gray
        opacity: 0.35,
        angle: degrees(35), // Angled to cover content safely
      });

      // Bottom footer disclaimer
      page.drawText(`Score600Academy - Exclusive Copy for ${userName} (Telegram ID: ${userId})`, {
        x: 40,
        y: 20,
        size: 8,
        color: rgb(0.4, 0.4, 0.4),
      });
    }

    // 5. Save the modified PDF and trigger an automatic download in the browser
    const modifiedPdfBytes = await pdfDoc.save();
    const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${gradeTitle}_Score600Academy.pdf`;
    link.click();

  } catch (error) {
    console.error("Error generating protected PDF:", error);
    alert("Could not download the PDF. Please ensure you are connected to the internet.");
  }
}