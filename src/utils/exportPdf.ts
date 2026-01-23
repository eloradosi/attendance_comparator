export async function exportTimesheetPdfWithWatermark(
    rows: { date: string; checkin?: string | null; checkout?: string | null }[],
    summary?: { employeeId?: string; employeeName?: string; note?: string; uniqueCode?: string },
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

        // Determine watermark text: prefer backend uniqueCode when available
        const watermark = (summary && (summary as any).uniqueCode) || watermarkText || "";

        // Embed a standard font so we can measure text width accurately
        const font = await pdfDoc.embedFont((PDFDocument as any).StandardFonts ? (PDFDocument as any).StandardFonts.Helvetica : undefined).catch(() => null);

        // Add watermark to each page at bottom-right, non-rotated
        for (const page of pages) {
            const { width, height } = page.getSize();
            const fontSize = Math.max(10, Math.min(14, Math.floor(width / 1200 * 12)));
            const margin = 40;

            let textWidth = 0;
            if (font && typeof (font as any).widthOfTextAtSize === "function") {
                try {
                    // @ts-ignore - pdf-lib types may not be recognized here
                    textWidth = (font as any).widthOfTextAtSize(watermark, fontSize);
                } catch (e) {
                    textWidth = watermark.length * fontSize * 0.5;
                }
            } else {
                textWidth = watermark.length * fontSize * 0.5;
            }

            const x = Math.max(margin, width - margin - textWidth);
            const y = margin; // bottom margin

            page.drawText(watermark, {
                x,
                y,
                size: fontSize,
                color: rgb(0.35, 0.35, 0.35),
                opacity: 0.7,
                font: font || undefined,
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
        alert(
            "Failed to add watermark to PDF. Please try again."
        );
        return;
    }

}

export default exportTimesheetPdfWithWatermark;
