// Share codemirror with plugins

if ( process.client && !window.__codeMirrorLoader ) {
  window.__codeMirrorLoader = () => import(/* webpackChunkName: "codemirror" */ '@/plugins/codemirror');
}
