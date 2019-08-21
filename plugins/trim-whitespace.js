import Vue from 'vue';

function trimEmptyTextNodes(el) {
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.data.trim() === '') {
      node.remove();
    }
  }
}

Vue.directive('trim-whitespace', {
  inserted:         trimEmptyTextNodes,
  componentUpdated: trimEmptyTextNodes
});
