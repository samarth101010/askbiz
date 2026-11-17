/**
 * Computes the cosine similarity between two vector arrays of numbers.
 * Cosine similarity = (A . B) / (||A|| * ||B||)
 * Returns a value between -1.0 and 1.0 (typically 0.0 to 1.0 for normalized text embeddings).
 *
 * @param {number[]} vecA - First vector
 * @param {number[]} vecB - Second vector
 * @returns {number} Cosine similarity score
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) {
    return 0;
  }

  const length = Math.min(vecA.length, vecB.length);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < length; i++) {
    const a = vecA[i];
    const b = vecB[i];
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

/**
 * Ranks all knowledge chunks by cosine similarity to the question embedding,
 * returning the top N most relevant chunks.
 *
 * @param {number[]} questionEmbedding - Vector for the customer question
 * @param {Array} chunks - Array of KnowledgeChunk documents from MongoDB
 * @param {number} topK - Number of top chunks to retrieve (default: 4)
 * @returns {Array} Top chunks with attached similarity score
 */
function findTopSimilarChunks(questionEmbedding, chunks, topK = 4) {
  if (!chunks || chunks.length === 0) return [];

  const scoredChunks = chunks.map((chunk) => {
    const score = cosineSimilarity(questionEmbedding, chunk.embedding);
    return {
      chunk,
      score: Number(score.toFixed(4))
    };
  });

  // Sort descending by similarity score
  scoredChunks.sort((a, b) => b.score - a.score);

  return scoredChunks.slice(0, topK);
}

module.exports = {
  cosineSimilarity,
  findTopSimilarChunks
};
