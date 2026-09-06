import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, apiVersion: 'v1' });

try {
  const result = await client.models.listModels({ pageSize: 50 });
  console.log('Models with embedContent support:');
  for (const model of result.models || []) {
    if (model.supportedMethods?.includes('embedContent')) {
      console.log(' -', model.name, '| displayName=', model.displayName, '| methods=', model.supportedMethods?.join(','));
    }
  }
  console.log('\nAll listed models (names):');
  for (const model of result.models || []) {
    console.log(' -', model.name);
  }
} catch (e) {
  console.error('listModels error:', e.message);
  try {
    console.log('Trying v1beta instead:');
    const b = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, apiVersion: 'v1beta' });
    const r = await b.models.listModels({ pageSize: 50 });
    for (const m of r.models || []) {
      if (m.supportedMethods?.includes('embedContent')) console.log(' v1beta -', m.name, m.displayName);
    }
  } catch (e2) { console.error('v1beta also failed:', e2.message); }
}
process.exit(0);
