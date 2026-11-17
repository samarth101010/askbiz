/**
 * Splits raw text into semantic chunks of roughly `chunkSize` characters
 * with `chunkOverlap` character overlap.
 *
 * @param {string} text - Raw extracted text from PDF or user input
 * @param {number} chunkSize - Target characters per chunk (default: 500)
 * @param {number} chunkOverlap - Overlap in characters to preserve context (default: 100)
 * @returns {string[]} Array of cleaned text chunks
 */
function chunkText(text, chunkSize = 500, chunkOverlap = 100) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // 1. Clean excessive whitespace and standardize newlines
  const cleanText = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (cleanText.length <= chunkSize) {
    return [cleanText];
  }

  const chunks = [];
  let startIndex = 0;

  while (startIndex < cleanText.length) {
    let endIndex = startIndex + chunkSize;

    // If remaining text fits within one chunk, grab the rest
    if (endIndex >= cleanText.length) {
      const remaining = cleanText.substring(startIndex).trim();
      if (remaining.length > 0) {
        chunks.push(remaining);
      }
      break;
    }

    // Try finding a natural break point (paragraph break, period, question mark, newline, or space)
    // within the last 120 characters of the window to avoid cutting words/sentences in half
    const searchBackDistance = Math.min(120, chunkSize - 20);
    const searchSlice = cleanText.substring(endIndex - searchBackDistance, endIndex);

    let naturalCutIndex = -1;

    // Check in order of preferred break: double newline > sentence ending > single newline > space
    const doubleNewline = searchSlice.lastIndexOf('\n\n');
    const period = searchSlice.lastIndexOf('. ');
    const question = searchSlice.lastIndexOf('? ');
    const exclamation = searchSlice.lastIndexOf('! ');
    const singleNewline = searchSlice.lastIndexOf('\n');
    const space = searchSlice.lastIndexOf(' ');

    if (doubleNewline !== -1) {
      naturalCutIndex = doubleNewline + 2;
    } else if (period !== -1) {
      naturalCutIndex = period + 2;
    } else if (question !== -1) {
      naturalCutIndex = question + 2;
    } else if (exclamation !== -1) {
      naturalCutIndex = exclamation + 2;
    } else if (singleNewline !== -1) {
      naturalCutIndex = singleNewline + 1;
    } else if (space !== -1) {
      naturalCutIndex = space + 1;
    }

    if (naturalCutIndex !== -1) {
      endIndex = (endIndex - searchBackDistance) + naturalCutIndex;
    }

    const chunk = cleanText.substring(startIndex, endIndex).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // Move next starting position back by the overlap amount
    startIndex = Math.max(startIndex + 1, endIndex - chunkOverlap);
  }

  return chunks;
}

module.exports = { chunkText };
