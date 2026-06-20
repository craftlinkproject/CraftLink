class TfIdfVectorizer {
  constructor() {
    this.vocab = {};
    this.idf = {};
    this.docCount = 0;
    this.fitted = false;
  }

  tokenize(text) {
    const arabic = /[\u0600-\u06FF]/;
    return text
      .toLowerCase()
      .replace(/[^\w\s\u0600-\u06FF]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length >= (arabic.test(t) ? 1 : 2));
  }

  _buildVocabulary(docs) {
    this.vocab = {};
    this.docCount = docs.length;
    const df = {};

    docs.forEach((doc) => {
      const tokens = this.tokenize(doc);
      const seen = new Set();

      tokens.forEach((t) => {
        if (!this.vocab[t]) this.vocab[t] = Object.keys(this.vocab).length;
        if (!seen.has(t)) {
          df[t] = (df[t] || 0) + 1;
          seen.add(t);
        }
      });
    });

    for (const [term, count] of Object.entries(df)) {
      this.idf[term] = 1 + Math.log((this.docCount + 1) / (count + 1));
    }

    this.fitted = true;
  }

  fit(docs) {
    this._buildVocabulary(docs);
    return this;
  }

  reset() {
    this.vocab = {};
    this.idf = {};
    this.docCount = 0;
    this.fitted = false;
  }

  _vectorize(text) {
    if (!this.fitted) throw new Error("Must call fit() first");

    const vec = new Array(Object.keys(this.vocab).length).fill(0);
    const tokens = this.tokenize(text);
    const tf = {};

    tokens.forEach((t) => {
      tf[t] = (tf[t] || 0) + 1;
    });

    const maxFreq = Math.max(...Object.values(tf), 1);

    for (const [term, count] of Object.entries(tf)) {
      const idx = this.vocab[term];
      if (idx !== undefined) {
        vec[idx] = (count / maxFreq) * this.idf[term];
      }
    }

    return vec;
  }

  cosineSimilarity(vecA, vecB) {
    let dot = 0, magA = 0, magB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      magA += vecA[i] * vecA[i];
      magB += vecB[i] * vecB[i];
    }

    const mag = Math.sqrt(magA) * Math.sqrt(magB);
    return mag === 0 ? 0 : dot / mag;
  }

  search(query, documents, keys = []) {
    const corpus = documents.map((doc) => {
      const parts = keys.map((k) => doc[k] || "").join(" ");
      return parts;
    });

    this.reset();
    this.fit(corpus);

    const queryVec = this._vectorize(query);
    const docVecs = corpus.map((d) => this._vectorize(d));

    return documents.map((doc, i) => ({
      item: doc,
      score: this.cosineSimilarity(queryVec, docVecs[i]),
    }));
  }
}

export { TfIdfVectorizer };
