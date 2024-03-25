import { createApp } from 'vue';
const app = createApp({});

export function trimWhitespace(el, dir) {
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

app.directive('trim-whitespace', {
  inserted:         trimWhitespace,
  componentUpdated: trimWhitespace
});
