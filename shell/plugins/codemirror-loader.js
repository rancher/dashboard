// Share codemirror with plugins

if ( !window.__codeMirrorLoader ) {
  window.__codeMirrorLoader = () => import(/* webpackChunkName: "codemirror" */ '@shell/plugins/codemirror');
}
