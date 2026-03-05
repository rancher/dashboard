/**
 * Transforms .md files into JS module exports.
 * Replaces frontmatter-markdown-loader with mode: ['body'].
 *
 * Extracts the body content (stripping any YAML frontmatter)
 * and exports it as { body: string }.
 */
function markdownPlugin() {
  return {
    name: 'rancher-markdown-loader',

    transform(code, id) {
      if (!/\.md$/i.test(id)) {
        return null;
      }

      let body = code;

      // Strip YAML frontmatter if present
      const frontmatterMatch = code.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);

      if (frontmatterMatch) {
        body = frontmatterMatch[2];
      }

      return {
        code: `export default ${ JSON.stringify({ body }) };`,
        map:  null,
      };
    },
  };
}

module.exports = { markdownPlugin };
