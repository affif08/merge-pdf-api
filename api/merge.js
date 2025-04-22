import { PDFDocument } from 'pdf-lib';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Only POST method is allowed' });
    }

    const { files, outputName } = req.body;

    if (!files || !Array.isArray(files) || files.length < 2) {
      return res.status(400).json({ error: 'At least two PDF files are required to merge' });
    }

    const mergedPdf = await PDFDocument.create();

    for (const fileBase64 of files) {
      const pdfBytes = Uint8Array.from(atob(fileBase64), c => c.charCodeAt(0));
      const srcPdf = await PDFDocument.load(pdfBytes);
      const pages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
      pages.forEach(page => mergedPdf.addPage(page));
    }

    const mergedBytes = await mergedPdf.save();
    const mergedBase64 = Buffer.from(mergedBytes).toString('base64');

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ filename: `${outputName || 'merged'}.pdf`, content: mergedBase64 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while merging PDFs' });
  }
}
