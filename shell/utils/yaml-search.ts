/**
 * Helpers for searching a YAML document shown in a CodeMirror editor (see
 * YamlOverridesEditor.vue). Matching works like a browser's find in page: a plain,
 * case-insensitive substring match, so "bar" also matches "fooBar".
 */

/** The search only runs once the query has at least this many characters. */
export const MIN_SEARCH_LENGTH = 3;

/** Name of the CodeMirror overlay, so it can be removed by name. */
export const YAML_SEARCH_OVERLAY = 'yaml-search';

/**
 * Class CodeMirror puts on the line background of a line without a match, so the
 * tint of a changed line can be dimmed like its text.
 */
export const SEARCH_DIM_LINE_CLASS = 'yaml-search-dim-line';

/**
 * Token styles returned by the overlay. CodeMirror turns them into `cm-<style>`
 * classes on the text, which CodeMirror.vue styles. A `line-background-<class>`
 * style puts `<class>` on the line background instead.
 */
export const SEARCH_STYLE = {
  KEY:   'yaml-search-key',
  VALUE: 'yaml-search-value',
  DIM:   `yaml-search-dim line-background-${ SEARCH_DIM_LINE_CLASS }`,
};

/** A styled range of a line, from the end of the previous segment up to `end`. */
export interface SearchSegment {
  end: number;
  style: string | null;
}

// The start of a line: indentation plus an optional list item dash.
const LINE_PREFIX = /^\s*(?:-\s+)?/;
// A mapping key (plain or quoted) and its colon, which must be followed by a space
// or the end of the line so a colon inside a value (e.g. a URL) isn't taken as one.
const KEY = /^(?:"(?:[^"\\]|\\.)*"|'(?:[^']|'')*'|[^\s"'][^:]*?):(?=\s|$)/;

/**
 * Count the case-insensitive, non-overlapping occurrences of `query` in `text`.
 * A single pass with `indexOf`, so it stays fast on very large documents.
 */
export function countMatches(text: string, query: string): number {
  if (!text || !query) {
    return 0;
  }

  const haystack = text.toLowerCase();
  const needle = query.toLowerCase();
  let count = 0;
  let from = haystack.indexOf(needle);

  while (from !== -1) {
    count++;
    from = haystack.indexOf(needle, from + needle.length);
  }

  return count;
}

/**
 * Split one line into styled segments for the search overlay. A line that
 * contains the (lowercased) `needle` gets its whole key (with the colon) and its
 * whole value styled. Any other line is dimmed. Indentation, dashes and the space
 * after a colon are left unstyled.
 */
export function yamlSearchSegments(line: string, needle: string): SearchSegment[] {
  if (!line) {
    return [];
  }

  if (!needle || !line.toLowerCase().includes(needle)) {
    return [{ end: line.length, style: SEARCH_STYLE.DIM }];
  }

  const segments: SearchSegment[] = [];
  let pos = (line.match(LINE_PREFIX) as RegExpMatchArray)[0].length;

  if (pos > 0) {
    segments.push({ end: pos, style: null });
  }

  const key = line.slice(pos).match(KEY);

  if (key) {
    pos += key[0].length;
    segments.push({ end: pos, style: SEARCH_STYLE.KEY });

    const valueStart = pos + (line.slice(pos).match(/^\s*/) as RegExpMatchArray)[0].length;

    if (valueStart > pos) {
      pos = valueStart;
      segments.push({ end: pos, style: null });
    }
  }

  // Whatever is left is the value (or, for a list item or a multi-line value,
  // the whole content of the line).
  if (pos < line.length) {
    segments.push({ end: line.length, style: SEARCH_STYLE.VALUE });
  }

  return segments;
}

/**
 * Build a CodeMirror overlay mode that styles the search results. CodeMirror only
 * runs an overlay for the lines it renders (and the rest in small background
 * chunks), so this stays fast even on huge documents. It is also re-run
 * automatically for lines the user edits.
 */
export function createYamlSearchOverlay(query: string) {
  const needle = (query || '').toLowerCase();
  // CodeMirror asks for the tokens of one line in order, so cache that line's
  // segments instead of recomputing them for every token.
  let cachedLine: string | null = null;
  let cachedSegments: SearchSegment[] = [];

  return {
    name: YAML_SEARCH_OVERLAY,

    token(stream: { string: string, pos: number, skipToEnd: () => void }) {
      if (stream.string !== cachedLine) {
        cachedLine = stream.string;
        cachedSegments = yamlSearchSegments(stream.string, needle);
      }

      const segment = cachedSegments.find((s) => s.end > stream.pos);

      if (!segment) {
        stream.skipToEnd();

        return null;
      }

      stream.pos = segment.end;

      return segment.style;
    },
  };
}
