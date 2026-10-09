import { MaybeRefOrGetter, toValue } from 'vue';
import jsyaml from 'js-yaml';
import type { EditorView } from '@codemirror/view';
import { foldAllComments, foldMatchingLines, foldYamlPath } from '@components/RcCodeMirror';
import { ANNOTATIONS_TO_FOLD } from '@shell/config/labels-annotations';
import { ensureRegex } from '@shell/utils/string';

const PATHS_TO_FOLD = [
  'links',
  'metadata.relationships',
  'metadata.fields',
  'metadata.finalizers',
];

/**
 * Folds the sections of a resource's yaml that are rarely edited: managedFields, comment blocks,
 * annotations written by tools (`ANNOTATIONS_TO_FOLD`), `PATHS_TO_FOLD` and the paths in the
 * model's `yamlFolding`
 *
 * @param resource The model whose yaml is in the editor, read when the editor is ready
 * @param foldStatus Fold the top-level `status`, read when the editor is ready
 * @returns `foldYaml`, to call with the EditorView the yaml editor emits in `onReady`. Fold state
 *          belongs to the EditorView, so a remounted editor starts unfolded
 */
export function useResourceYamlFolding(
  resource: MaybeRefOrGetter<{ yamlFolding?: string[] } | undefined>,
  foldStatus: MaybeRefOrGetter<boolean> = false
) {
  const foldYaml = (view: EditorView): void => {
    if (toValue(foldStatus)) {
      foldMatchingLines(view, /^status:\s*$/);
    }

    try {
      const parsed = jsyaml.load(view.state.doc.toString()) as { metadata?: { annotations?: object } } | undefined;
      const annotations = Object.keys(parsed?.metadata?.annotations || {});
      const regexes = ANNOTATIONS_TO_FOLD.map((x) => ensureRegex(x));

      if (annotations.some((k) => regexes.some((regex) => regex.test(k)))) {
        foldMatchingLines(view, /^\s+annotations:\s*$/);
      }
    } catch (e) {
      // invalid yaml: annotations stay unfolded
    }

    foldMatchingLines(view, /managedFields/);

    [...PATHS_TO_FOLD, ...(toValue(resource)?.yamlFolding || [])].forEach((path) => foldYamlPath(view, path));

    foldAllComments(view);
  };

  return { foldYaml };
}
