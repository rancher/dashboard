// Generate simple Table of Contents from the markdown content
// Returns an array of table of contents meatdata

const TOC_REGEX = /^(#+)\s(.*)/;

export function generateToc(body) {
  const toc = [];
  const lines = body.split('\n');

  lines.forEach((line) => {
    const m = line.match(TOC_REGEX);

    if (m && m.length === 3) {
      const depth = m[1].length;
      const text = m[2];
      const id = text.toLowerCase().replace(/[^\w]+/g, '-');

      toc.push({
        depth,
        id,
        text
      });
    }
  });

  return toc;
}
