export async function exportTimesheetPdfWithWatermark(
    rows: { date: string; checkin?: string | null; checkout?: string | null }[],
    summary?: { employeeId?: string; employeeName?: string; note?: string },
    watermarkText = "PASSED"
) {
    // Load the original PDF from sessionStorage
    const pdfBase64 = sessionStorage.getItem("originalTimesheetPdf");
    const originalFilename = sessionStorage.getItem("originalTimesheetFilename") || "timesheet.pdf";

    if (!pdfBase64) {
        alert("Original timesheet PDF not found. Please upload files again.");
        return;
    }

    try {
        // Dynamically import pdf-lib
        const { PDFDocument, rgb, degrees } = await import("pdf-lib");

        // Decode base64 to bytes
        const binaryString = atob(pdfBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Load the PDF
        const pdfDoc = await PDFDocument.load(bytes);
        const pages = pdfDoc.getPages();

        // Add watermark to each page
        for (const page of pages) {
            const { width, height } = page.getSize();
            const fontSize = 72;
            const textWidth = watermarkText.length * fontSize * 0.5; // Approximate

            // Draw watermark in center, rotated
            page.drawText(watermarkText, {
                x: width / 2 - textWidth / 2,
                y: height / 2,
                size: fontSize,
                color: rgb(0.8, 0.8, 0.8),
                opacity: 0.3,
                rotate: degrees(-30),
            });
        }

        // Save modified PDF
        const pdfBytes = await pdfDoc.save();

        // Download - convert to standard Uint8Array for Blob compatibility
        const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        const filename = originalFilename.replace(/\.pdf$/i, "") + "_PASSED.pdf";
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Failed to add watermark to PDF:", err);
        alert(
            "Failed to add watermark to PDF. Please try again or check console for details."
        );
        return;
    }

}

export default exportTimesheetPdfWithWatermark;
