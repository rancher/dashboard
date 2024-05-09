function trimWhitespace(el, dir) {
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE ) {
      const trimmed = node.data.trim();

      if ( trimmed === '') {
        node.remove();
      } else if ( trimmed !== node.data ) {
        node.data = trimmed;
      }
    }
  }
}
const trimWhitespaceDirective = {
  inserted:         trimWhitespace,
  componentUpdated: trimWhitespace
};

export default trimWhitespaceDirective;
