// Share codemirror with plugins

if ( !window.__codeMirrorLoader ) {
  window.__codeMirrorLoader = () => import('@shell/plugins/codemirror');
}
