import {
  countMatches, yamlSearchSegments, createYamlSearchOverlay, SEARCH_STYLE, SEARCH_DIM_LINE_CLASS, YAML_SEARCH_OVERLAY
} from '@shell/utils/yaml-search';

const { KEY, VALUE, DIM } = SEARCH_STYLE;

describe('fx: yaml-search', () => {
  describe('countMatches', () => {
    it.each([
      ['a single match', 'foo: bar\n', 'bar', 1],
      ['a match inside a word', 'fooBar: 1\n', 'bar', 1],
      ['matches regardless of case', 'BAR: bar\nBaR: 1\n', 'bar', 3],
      ['matches across keys and values', 'image:\n  repository: my/image\n', 'image', 2],
      ['no match', 'foo: bar\n', 'baz', 0],
    ])('counts %s', (_label, text, query, expected) => {
      expect(countMatches(text, query)).toStrictEqual(expected);
    });

    it('does not count overlapping matches', () => {
      expect(countMatches('aaaa', 'aaa')).toStrictEqual(1);
    });

    it.each([
      ['empty text', '', 'foo'],
      ['empty query', 'foo: bar', ''],
      ['null text', null as any, 'foo'],
      ['null query', 'foo: bar', null as any],
    ])('returns 0 for %s', (_label, text, query) => {
      expect(countMatches(text, query)).toStrictEqual(0);
    });
  });

  describe('yamlSearchSegments', () => {
    it('dims a line without a match', () => {
      expect(yamlSearchSegments('  replicas: 2', 'bar')).toStrictEqual([{ end: 13, style: DIM }]);
    });

    it('marks the line background of a line without a match', () => {
      expect(DIM).toStrictEqual(`yaml-search-dim line-background-${ SEARCH_DIM_LINE_CLASS }`);
    });

    it('returns no segments for an empty line', () => {
      expect(yamlSearchSegments('', 'bar')).toStrictEqual([]);
    });

    it('styles the key with its colon and the value of a matched line', () => {
      expect(yamlSearchSegments('foo: bar', 'bar')).toStrictEqual([
        { end: 4, style: KEY },
        { end: 5, style: null },
        { end: 8, style: VALUE },
      ]);
    });

    it('styles the whole line when only the key matches', () => {
      expect(yamlSearchSegments('fooBar: 1', 'bar')).toStrictEqual([
        { end: 7, style: KEY },
        { end: 8, style: null },
        { end: 9, style: VALUE },
      ]);
    });

    it('leaves the indentation unstyled', () => {
      expect(yamlSearchSegments('    tag: bar', 'bar')).toStrictEqual([
        { end: 4, style: null },
        { end: 8, style: KEY },
        { end: 9, style: null },
        { end: 12, style: VALUE },
      ]);
    });

    it('styles only the key of a map header', () => {
      expect(yamlSearchSegments('  sidebar:', 'bar')).toStrictEqual([
        { end: 2, style: null },
        { end: 10, style: KEY },
      ]);
    });

    it('styles a list item without a key as a value', () => {
      expect(yamlSearchSegments('  - foobar', 'bar')).toStrictEqual([
        { end: 4, style: null },
        { end: 10, style: VALUE },
      ]);
    });

    it('styles the key of a mapping inside a list item', () => {
      expect(yamlSearchSegments('- name: bar', 'bar')).toStrictEqual([
        { end: 2, style: null },
        { end: 7, style: KEY },
        { end: 8, style: null },
        { end: 11, style: VALUE },
      ]);
    });

    it('does not treat a colon inside a value as the key separator', () => {
      expect(yamlSearchSegments('url: http://bar.io', 'bar')).toStrictEqual([
        { end: 4, style: KEY },
        { end: 5, style: null },
        { end: 18, style: VALUE },
      ]);
    });

    it('styles a line without a key as a value', () => {
      expect(yamlSearchSegments('http://bar.io', 'bar')).toStrictEqual([{ end: 13, style: VALUE }]);
    });

    it('handles a quoted key that contains a colon', () => {
      expect(yamlSearchSegments('"a: b": bar', 'bar')).toStrictEqual([
        { end: 7, style: KEY },
        { end: 8, style: null },
        { end: 11, style: VALUE },
      ]);
    });

    it('matches regardless of the case in the line', () => {
      expect(yamlSearchSegments('BAR: 1', 'bar')).toStrictEqual([
        { end: 4, style: KEY },
        { end: 5, style: null },
        { end: 6, style: VALUE },
      ]);
    });
  });

  describe('createYamlSearchOverlay', () => {
    // Run the overlay over one line the way CodeMirror does, collecting each token.
    const tokenize = (overlay: ReturnType<typeof createYamlSearchOverlay>, line: string) => {
      const stream = {
        string: line,
        pos:    0,
        skipToEnd() {
          this.pos = line.length;
        },
      };
      const tokens: [string, string | null][] = [];

      while (stream.pos < line.length) {
        const start = stream.pos;
        const style = overlay.token(stream);

        tokens.push([line.slice(start, stream.pos), style]);
      }

      return tokens;
    };

    it('is named so it can be removed by name', () => {
      expect(createYamlSearchOverlay('bar').name).toStrictEqual(YAML_SEARCH_OVERLAY);
    });

    it('tokenizes a matched line into key and value', () => {
      const overlay = createYamlSearchOverlay('BAR');

      expect(tokenize(overlay, '  foo: bar')).toStrictEqual([
        ['  ', null],
        ['foo:', KEY],
        [' ', null],
        ['bar', VALUE],
      ]);
    });

    it('dims an unmatched line in a single token', () => {
      const overlay = createYamlSearchOverlay('bar');

      expect(tokenize(overlay, 'replicas: 2')).toStrictEqual([['replicas: 2', DIM]]);
    });

    it('tokenizes each new line afresh', () => {
      const overlay = createYamlSearchOverlay('bar');

      tokenize(overlay, 'foo: bar');

      expect(tokenize(overlay, 'baz: 1')).toStrictEqual([['baz: 1', DIM]]);
    });

    it('skips to the end if asked for a position past the last segment', () => {
      const overlay = createYamlSearchOverlay('bar');
      const stream = {
        string: 'foo: bar', pos: 8, skipToEnd: jest.fn()
      };

      expect(overlay.token(stream)).toBeNull();
      expect(stream.skipToEnd).toHaveBeenCalledWith();
    });
  });
});
