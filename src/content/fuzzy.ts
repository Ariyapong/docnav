// Tiny subsequence-based fuzzy matcher.
// Returns null if any query char can't be matched in order, otherwise a score
// (lower is better) and the matched indices for highlighting.

export interface FuzzyMatch {
  score: number;
  indices: number[];
}

export function fuzzyMatch(query: string, target: string): FuzzyMatch | null {
  if (!query) return { score: 0, indices: [] };
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  const indices: number[] = [];

  let ti = 0;
  let lastIdx = -2;
  let score = 0;

  for (let qi = 0; qi < q.length; qi++) {
    const c = q[qi];
    let found = -1;
    for (; ti < t.length; ti++) {
      if (t[ti] === c) {
        found = ti;
        break;
      }
    }
    if (found === -1) return null;
    indices.push(found);
    // Reward consecutive matches and word-boundary matches.
    const prev = found > 0 ? t[found - 1] : " ";
    const isBoundary = /[\s\-_/.()[\]]/.test(prev) || found === 0;
    const gap = found - lastIdx - 1;
    score += gap;
    if (gap === 0) score -= 2;
    if (isBoundary) score -= 1;
    lastIdx = found;
    ti = found + 1;
  }

  // Slight bias toward shorter targets so "intro" beats "introspection".
  score += target.length * 0.01;
  return { score, indices };
}

export function highlight(text: string, indices: number[]): DocumentFragment {
  const frag = document.createDocumentFragment();
  if (indices.length === 0) {
    frag.appendChild(document.createTextNode(text));
    return frag;
  }
  const set = new Set(indices);
  let buffer = "";
  let inMark = false;
  const flush = () => {
    if (!buffer) return;
    const node = inMark ? document.createElement("mark") : document.createTextNode(buffer) as Node;
    if (inMark) {
      (node as HTMLElement).textContent = buffer;
    }
    frag.appendChild(node);
    buffer = "";
  };
  for (let i = 0; i < text.length; i++) {
    const isHit = set.has(i);
    if (isHit !== inMark) {
      flush();
      inMark = isHit;
    }
    buffer += text[i];
  }
  flush();
  return frag;
}
