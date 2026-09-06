import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const CANDIDATES = [
  'text-embedding-004',
  'text-embedding-001',
  'text-multilingual-embedding-002',
  'text-embedding-preview-0409',
  'text-multilingual-embedding-preview-0409',
  'embedding-001',
  'models/text-embedding-004',
  'models/text-embedding-001',
  'models/text-multilingual-embedding-002',
  'models/embedding-001',
];

const API_VERSIONS = ['v1', 'v1beta'];

for (const apiVersion of API_VERSIONS) {
  console.log(`\n=== Trying apiVersion=${apiVersion} ===`);
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, apiVersion });
  for (const m of CANDIDATES) {
    try {
      const r = await client.models.embedContent({ model: m, contents: 'hello world test' });
      if (r?.embedding?.values?.length) {
        console.log(`SUCCESS: ${m} -> dim=${r.embedding.values.length}`);
        process.exit(0);
      } else {
        console.log(`WEIRD: ${m} returned no values`);
      }
    } catch (e) {
      const msg = e?.message || String(e);
      // only print short
      const short = msg.split('\n')[0].slice(0, 160);
      console.log(`FAIL ${m}: ${short}`);
    }
  }
}
process.exit(0);
