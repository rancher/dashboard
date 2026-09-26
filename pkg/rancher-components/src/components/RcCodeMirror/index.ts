export { default as RcCodeMirror } from './RcCodeMirror.vue';
export type {
  RcCodeMirrorProps,
  RcCodeMirrorLanguage,
  RcCodeMirrorKeymap,
  RcCodeMirrorTheme,
  RcCodeMirrorVariant,
} from './types';
export type { FoldOptions, FoldServiceFn } from './extensions/fold';
export {
  indentFoldService,
  bracketFoldService,
  commentFoldService,
  foldByLineMatch,
  foldByYamlPath,
  foldMatchingLines,
  foldYamlPath,
  foldAllComments,
} from './extensions/fold';
