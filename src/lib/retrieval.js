// Local, dependency-free retrieval for the RAG demo.
//
// This is an honest in-browser approximation of a vector store: documents are
// split into overlapping chunks, each chunk and the query are embedded as a
// term-frequency bag-of-words vector, and ranking is by cosine similarity.
// A production system would swap this for real embeddings + a vector DB
// (Pinecone/pgvector/etc.) — the UI dropdowns name which.

function tokenize(text) {
  return text.toLowerCase().match(/[a-z0-9]+/g) || [];
}

// Split text into chunks of ~chunkSize characters with `overlap` chars of
// carry-over between consecutive chunks. Splits on word boundaries.
export function chunkText(text, chunkSize = 512, overlap = 64) {
  const clean = text.trim();
  if (clean.length <= chunkSize) return [clean];
  const step = Math.max(1, chunkSize - overlap);
  const chunks = [];
  for (let start = 0; start < clean.length; start += step) {
    let end = Math.min(clean.length, start + chunkSize);
    // Prefer to break at a space so we don't cut words in half.
    if (end < clean.length) {
      const space = clean.lastIndexOf(" ", end);
      if (space > start) end = space;
    }
    chunks.push(clean.slice(start, end).trim());
    if (end >= clean.length) break;
  }
  return chunks.filter(Boolean);
}

function termFreq(tokens) {
  const tf = new Map();
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
  return tf;
}

function cosine(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const [, v] of a) normA += v * v;
  for (const [, v] of b) normB += v * v;
  for (const [k, v] of a) {
    const bv = b.get(k);
    if (bv) dot += v * bv;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Retrieve the top-K most similar chunks across all docs for the query.
// Each result: { docId, name, type, chunkIndex, text, score }.
export function retrieve(query, docs, { topK = 2, chunkSize = 512, overlap = 64 } = {}) {
  const queryVec = termFreq(tokenize(query));
  const scored = [];
  for (const doc of docs) {
    const chunks = chunkText(doc.content, chunkSize, overlap);
    chunks.forEach((text, chunkIndex) => {
      const score = cosine(queryVec, termFreq(tokenize(text)));
      scored.push({
        docId: doc.id,
        name: doc.name,
        type: doc.type,
        chunkIndex,
        text,
        score,
      });
    });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}
