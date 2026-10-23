const fs = require('fs');
const { PDFParse } = require('pdf-parse');

async function extractText() {
    try {
        const pdfPath = '/Users/el/Desktop/dodam/대대손손보고서/[별첨 1] 2025년도 예비창업패키지 사업계획서 양식 (1).pdf';
        const dataBuffer = fs.readFileSync(pdfPath);

        // Pass buffer as data option
        const parser = new PDFParse({ data: dataBuffer });
        const result = await parser.getText();

        console.log(result.text);

        // Always clean up
        await parser.destroy();
    } catch (error) {
        console.error("Error extracting text:", error);
    }
}

extractText();
