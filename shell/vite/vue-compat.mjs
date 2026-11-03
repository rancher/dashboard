const SCRIPT = /(<script\b(?![^>]*\bsetup\b)[^>]*>)([\s\S]*?)(<\/script>)/;
const PARENTHESISED_DEFAULT = /\bexport\s+default\s*\(/;
const DEFAULT = '__rancher_sfc_default__';

/**
 * Let components whose `<script>` exports its options in parentheses, `export default ({ ... });`, compile:
 * @vue/compiler-sfc drops the opening parenthesis but not the closing one when it renames the default export for
 * @vitejs/plugin-vue, which webpack's vue-loader did not ask it to do
 */
export function vueParenthesisedDefaultExport() {
  return {
    name:    'rancher:vue-parenthesised-default-export',
    enforce: 'pre',

    transform(code, id) {
      if (!id.endsWith('.vue') || !PARENTHESISED_DEFAULT.test(code)) {
        return;
      }

      const out = code.replace(SCRIPT, (match, open, content, close) => {
        if (!PARENTHESISED_DEFAULT.test(content)) {
          return match;
        }

        const body = content.replace(PARENTHESISED_DEFAULT, `const ${ DEFAULT } = (`).trimEnd();
        const trailing = content.slice(content.trimEnd().length);

        return `${ open }${ body }\n;export default ${ DEFAULT };${ trailing.replace(/^\r?\n/, '') }${ close }`;
      });

      return out === code ? undefined : { code: out, map: null };
    },
  };
}
