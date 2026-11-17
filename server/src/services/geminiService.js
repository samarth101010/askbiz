const { GoogleGenerativeAI } = require('@google/generative-ai');

function generateFallbackEmbedding(text) {
  const dim = 768;
  const vector = new Array(dim).fill(0);
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) & 0xffffffff;
    const bucket = Math.abs(hash) % dim;
    vector[bucket] += (i % 7 === 0 ? -1 : 1) * ((text.charCodeAt(i) % 10) + 1);
  }
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vector.map((val) => Number((val / magnitude).toFixed(6)));
}

async function generateEmbedding(text) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return generateFallbackEmbedding(text);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('[Gemini Embedding Error]:', error.message);
    return generateFallbackEmbedding(text);
  }
}

async function batchEmbedChunks(chunks) {
  const embeddings = [];
  for (let i = 0; i < chunks.length; i++) {
    const embedding = await generateEmbedding(chunks[i]);
    embeddings.push(embedding);
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }
  return embeddings;
}

async function generateRAGAnswer({ businessName, question, contextChunks }) {
  const apiKey = process.env.GEMINI_API_KEY;

  const contextText = contextChunks.length > 0
    ? contextChunks.map((c, i) => `[Knowledge Chunk ${i + 1}]:\n${c}`).join('\n\n')
    : 'No relevant business documents found.';

  const prompt = `You are the official AI customer support assistant for "${businessName}".
Your job is to answer customer questions accurately, politely, and concisely using ONLY the provided business knowledge below.

================ OFFICIAL BUSINESS KNOWLEDGE ================
${contextText}
=============================================================

CUSTOMER QUESTION:
${question}

STRICT RULES:
1. Base your answer ONLY on the official business knowledge provided above.
2. If the answer cannot be found in the knowledge provided, or if the context does not contain sufficient details, you MUST reply:
   "I'm sorry, but I don't have that information in my knowledge base. Please contact ${businessName} directly for assistance."
3. Never invent, extrapolate, or guess information not present in the knowledge text.
4. Keep your answer direct, natural, and helpful. Do not mention "chunks", "context", or "source documents" in your answer.`;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    if (contextChunks.length === 0) {
      return `I'm sorry, but I don't have that information in my knowledge base. Please contact ${businessName} directly for assistance.`;
    }
    return `[Gemini Simulated Response - Please set your free GEMINI_API_KEY in server/.env for live AI responses]\n\nBased on ${businessName}'s documentation:\n${contextChunks[0].substring(0, 300)}...`;
  }

  // Robust priority order of available models for fastest latency and highest uptime
  const modelCandidates = [
    'gemini-flash-lite-latest',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash-lite',
    'gemini-3.8-flash'
  ];
  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of modelCandidates) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 600
        }
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (err) {
      console.warn(`[Gemini Generation] Retrying with next model after ${modelName} error:`, err.message.split('\n')[0]);
    }
  }

  throw new Error('All Gemini generation model candidates failed. Please verify API key.');
}

module.exports = {
  generateEmbedding,
  batchEmbedChunks,
  generateRAGAnswer
};
