import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

async function test() {
  const dataBuffer = fs.readFileSync('C:\\Users\\perna\\.gemini\\antigravity\\brain\\c8499092-260f-4b90-8239-15d5bfe9ad97\\scratch\\ELENCO_CODICI_CER.pdf');
  const uint8Array = new Uint8Array(dataBuffer);
  const instance = new pdf.PDFParse(uint8Array);
  try {
    const textData = await instance.getText();
    fs.writeFileSync('C:\\Users\\perna\\.gemini\\antigravity\\brain\\c8499092-260f-4b90-8239-15d5bfe9ad97\\scratch\\pdf_text.txt', textData.text);
    console.log('Saved to pdf_text.txt successfully.');
  } catch (err) {
    console.error(err);
  }
}

test();
