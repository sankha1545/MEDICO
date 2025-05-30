// lib/website-rag.ts

interface Doc { text: string; source: string; }

// Demo content; replace with your real site text chunks
const docs: Doc[] = [
  { text: "Our product is a lightweight React UI library built with Tailwind.", source: "/docs/overview" },
  { text: "To install, run `npm install my-ui-library`.", source: "/docs/getting-started" },
  { text: "Dark mode is enabled via the `dark:` prefix in Tailwind.", source: "/docs/theming" },
];

/**
 * Returns top-k docs matching the question via simple keyword score.
 * In production swap this for an embeddings + vector DB lookup.
 */
export async function getWebsiteAnswer(
  question: string,
  k = 3
): Promise<Doc[]> {
  const q = question.toLowerCase();
  // naive scoring by substring count
  const scored = docs.map(d => ({
    doc: d,
    score: d.text.toLowerCase().split(q).length - 1
  }));
  const top = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(s => s.doc);
  return top.length ? top : docs.slice(0, k);
}
