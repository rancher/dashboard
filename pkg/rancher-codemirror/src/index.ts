export { default as CodeMirror } from './components/CodeMirror.vue'
export type { Props as CodeMirrorProps } from './components/CodeMirror.vue'
export type { FoldOptions } from './extensions/fold'
export {
  indentFoldService, bracketFoldService,
  foldByLineMatch, foldByYamlPath,
  foldMatchingLines, foldYamlPath
} from './extensions/fold'
