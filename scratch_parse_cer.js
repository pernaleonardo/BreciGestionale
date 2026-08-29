import fs from 'fs';

function run() {
  const text = fs.readFileSync('C:\\Users\\perna\\.gemini\\antigravity\\brain\\c8499092-260f-4b90-8239-15d5bfe9ad97\\scratch\\pdf_text.txt', 'utf8');
  
  const lines = text.split('\n');
  const categoriesMap = new Map();
  const cerCodes = [];

  // Definizione manuale dei capitoli standard (non troncati)
  const defaultCategories = {
    '01': 'Rifiuti da estrazione e prospezione di miniere e cave',
    '02': 'Rifiuti da agricoltura, selvicoltura, caccia e pesca',
    '03': 'Rifiuti da lavorazione del legno, carta e cartone',
    '04': 'Rifiuti da industria tessile e conciaria',
    '05': 'Rifiuti da raffinazione del petrolio e trattamento carbone',
    '06': 'Rifiuti da processi chimici inorganici',
    '07': 'Rifiuti da processi chimici organici',
    '08': 'Rifiuti da produzione di vernici, pitture, inchiostri e adesivi',
    '09': 'Rifiuti dell\'industria fotografica',
    '10': 'Rifiuti provenienti da processi termici',
    '11': 'Rifiuti da trattamento chimico e rivestimento di metalli',
    '12': 'Rifiuti da lavorazione fisica e meccanica di metalli e plastica',
    '13': 'Oli esausti e residui di combustibili liquidi',
    '14': 'Solventi organici e refrigeranti esausti',
    '15': 'Imballaggi, assorbenti, stracci e materiali filtranti',
    '16': 'Rifiuti non specificati altrove nel catalogo',
    '17': 'Rifiuti da operazioni di costruzione e demolizione',
    '18': 'Rifiuti sanitari e veterinari o da attività di ricerca',
    '19': 'Rifiuti da impianti di trattamento rifiuti e acque reflue',
    '20': 'Rifiuti urbani e domestici della raccolta differenziata'
  };

  // Carichiamo i capitoli di default nel nostro map
  for (const [k, v] of Object.entries(defaultCategories)) {
    categoriesMap.set(k, v);
  }

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Cerca codici CER: es. "010101rifiuti da..." o "010304*sterili..."
    const cerMatch = line.match(/^(\d{6})(\*?)\s*(.*)$/);
    if (cerMatch) {
      const fullCode = cerMatch[1] + cerMatch[2]; // es: 010101 o 010304*
      const rawDesc = cerMatch[3].trim();
      
      // Salta righe di intestazione o falsi positivi
      if (rawDesc.toLowerCase().startsWith('codice cer') || rawDesc.toLowerCase().startsWith('cer da riportare')) {
        continue;
      }
      
      // Formatta il codice come "XX XX XX" o "XX XX XX*" per leggibilità
      const parts = cerMatch[1].match(/.{1,2}/g) || [];
      const formattedCode = parts.join(' ') + cerMatch[2];

      const prefix = cerMatch[1].substring(0, 2);
      cerCodes.push({
        cerCode: formattedCode,
        rawCode: fullCode,
        description: rawDesc,
        categoryPrefix: prefix
      });
    }
  }

  console.log('Categories loaded:', categoriesMap.size);
  console.log('Total CER codes found:', cerCodes.length);

  // Salviamo in formato JSON per l'importazione
  const mappedCodes = cerCodes.map(c => {
    const categoryName = categoriesMap.get(c.categoryPrefix) || 'Altro';
    return {
      cerCode: c.cerCode,
      description: c.description,
      category: `${c.categoryPrefix} - ${categoryName}`
    };
  });

  fs.writeFileSync('C:\\Users\\perna\\.gemini\\antigravity\\brain\\c8499092-260f-4b90-8239-15d5bfe9ad97\\scratch\\cer_codes.json', JSON.stringify(mappedCodes, null, 2));
  console.log('Saved parsed CER codes with clean categories.');
}

run();
