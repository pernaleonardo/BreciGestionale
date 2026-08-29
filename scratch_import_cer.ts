import { db } from './src/prisma/db';
import fs from 'fs';

async function run() {
  const data = JSON.parse(fs.readFileSync('C:\\Users\\perna\\.gemini\\antigravity\\brain\\c8499092-260f-4b90-8239-15d5bfe9ad97\\scratch\\cer_codes.json', 'utf8'));
  console.log(`Loaded ${data.length} CER codes from JSON.`);

  let createdCount = 0;
  let updatedCount = 0;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    // Sincronizza i codici CER nel DB (inserisce o aggiorna se già esistenti)
    const existing = await db.orm.public.WasteType.where({ cerCode: item.cerCode }).first();
    if (!existing) {
      await db.orm.public.WasteType.create({
        cerCode: item.cerCode,
        description: item.description,
        category: item.category,
      });
      createdCount++;
    } else {
      await db.orm.public.WasteType.where({ id: existing.id }).update({
        description: item.description,
        category: item.category,
      });
      updatedCount++;
    }

    if ((i + 1) % 100 === 0) {
      console.log(`Processed ${i + 1}/${data.length} codes...`);
    }
  }

  console.log(`Completed database import. Created: ${createdCount}, Updated: ${updatedCount}`);
}

run().catch(console.error);
