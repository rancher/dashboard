import { convert, matching, parse, simplify } from '@shell/utils/selector';

describe('fx: parse', () => {
  describe('using operator In', () => {
    it.each([
      ['key=value'],
      ['key= value'],
      ['key =value'],
      ['key = value'],
      ['  key  =  value  '],
      ['key==value'],
      ['key== value'],
      ['key ==value'],
      ['key == value'],
      ['  key  ==  value  '],
      ['key in (value)'],
      ['  key IN ( value )  '],
      ['key in(value)'],
    ])('should parse expression "%p" to selector', (expression) => {
      const expected = {
        key:      'key',
        operator: 'In',
        values:   ['value']
      };

      const result = parse(expression);

      expect(result).toStrictEqual([expected]);
    });

    it.each([
      ['some.prefix/key=value'],
      ['some.prefix/key= value'],
      ['some.prefix/key =value'],
      ['some.prefix/key = value'],
      ['  some.prefix/key  =  value  '],
    ])('should parse expression with a path "%p" to selector', (expression) => {
      const expected = {
        key:      'some.prefix/key',
        operator: 'In',
        values:   ['value']
      };

      const result = parse(expression);

      expect(result).toStrictEqual([expected]);
    });

    it.each([
      ['key+in+(value1,value2)'],
      ['key IN( value1 , value2 )'],
    ])('should parse expression "%p" to selector with multiple values', (expression) => {
      const expected = {
        key:      'key',
        operator: 'In',
        values:   ['value1', 'value2']
      };

      const result = parse(expression);

      expect(result).toStrictEqual([expected]);
    });
  });

  describe('using operator NotIn', () => {
    it.each([
      ['key!=value'],
      ['key!= value'],
      ['key !=value'],
      ['key != value'],
      ['  key  !=  value  '],
    ])('should parse expression "%p" to selector', (expression) => {
      const expected = {
        key:      'key',
        operator: 'NotIn',
        values:   ['value']
      };

      const result = parse(expression);

      expect(result).toStrictEqual([expected]);
    });

    it.each([
      ['some.prefix/key!=value'],
      ['some.prefix/key!= value'],
      ['some.prefix/key !=value'],
      ['some.prefix/key != value'],
      ['  some.prefix/key  !=  value  '],
      ['some.prefix/key notin (value)'],
      ['  some.prefix/key NOTIN ( value )  '],
      ['some.prefix/key Not In(value)'],
      ['some.prefix/key NotIn(value)'],
    ])('should parse expression with a path "%p" to selector', (expression) => {
      const expected = {
        key:      'some.prefix/key',
        operator: 'NotIn',
        values:   ['value']
      };

      const result = parse(expression);

      expect(result).toStrictEqual([expected]);
    });

    it.each([
      ['key+NOTIN+(value1,value2)'],
      ['key notin (value1,value2)'],
      ['key not in (value1,value2)'],
      ['key notIn( value1 , value2 )'],
    ])('should parse expression "%p" to selector with multiple values', (expression) => {
      const expected = {
        key:      'key',
        operator: 'NotIn',
        values:   ['value1', 'value2']
      };

      const result = parse(expression);

      expect(result).toStrictEqual([expected]);
    });
  });

  describe('using operator Exists', () => {
    it.each([
      ['key'],
      [' key'],
      [' key '],
    ])('should parse expression "%p" to selector', (expression) => {
      const expected = {
        key:      'key',
        operator: 'Exists',
      };

      const result = parse(expression);

      expect(result).toStrictEqual([expected]);
    });

    it.each([
      [' some.prefix/key-bar_baz '],
    ])('should parse expression with a path "%p" to selector', (expression) => {
      const expected = {
        key:      'some.prefix/key-bar_baz',
        operator: 'Exists',
      };
      const result = parse(expression);

      expect(result).toStrictEqual([expected]);
    });
  });

  describe('using operator DoesNotExist', () => {
    it.each([
      ['!key'],
      [' !key'],
      ['! key '],
      [' !  key '],
    ])('should parse expression %p to selector %p', (expression) => {
      const expected = {
        key:      'key',
        operator: 'DoesNotExist',
      };

      const result = parse(expression);

      expect(result).toStrictEqual([expected]);
    });

    it.each([
      ['!some.prefix/key-bar_baz '],
      ['! some.prefix/key-bar_baz '],
      [' !  some.prefix/key-bar_baz '],
    ])('should parse expression %p to selector %p', (expression) => {
      const expected = {
        key:      'some.prefix/key-bar_baz',
        operator: 'DoesNotExist',
      };

      const result = parse(expression);

      expect(result).toStrictEqual([expected]);
    });
  });

  it('should parse compound', () => {
    const expression = `foo=bar,+bar notin (  baz,qux)  ,
     some.domain/key, environment   IN  (production,  qa  )  ,
     !  another.domain/no-key`;
    const expected = [
      {
        key:      'foo',
        operator: 'In',
        values:   ['bar']
      },
      {
        key:      'bar',
        operator: 'NotIn',
        values:   ['baz', 'qux']
      },
      {
        key:      'some.domain/key',
        operator: 'Exists'
      },
      {
        key:      'environment',
        operator: 'In',
        values:   ['production', 'qa']
      },
      {
        key:      'another.domain/no-key',
        operator: 'DoesNotExist'
      },
    ];

    const result = parse(expression);

    expect(result).toStrictEqual(expected);
  });
});

describe('fx: convertSelectorObj', () => {
});

describe('fx: convert', () => {
  it('should convert labels to expression', () => {
    const matchLabelsObj = {
      foo: 'bar',
      baz: 'bat',
    };
    const expected = [
      {
        key:      'foo',
        operator: 'In',
        values:   ['bar']
      },
      {
        key:      'baz',
        operator: 'In',
        values:   ['bat']
      },
    ];

    const result = convert(matchLabelsObj);

    expect(result).toStrictEqual(expected);
  });

  it('should prevent errors and return empty list if no parameter is provided', () => {
    const result = convert();

    expect(result).toStrictEqual([]);
    expect(() => result).not.toThrow();
  });
});

describe('fx: simplify', () => {
  it('should convert simple expressions to labels', () => {
    const input = [
      {
        key:      'foo',
        operator: 'In',
        values:   ['bar']
      },
      {
        key:      'baz',
        operator: 'In',
        values:   ['bat']
      },
    ];
    const expected = {
      matchLabels: {
        foo: 'bar',
        baz: 'bat',
      },
      matchExpressions: [],
    };

    const result = simplify(input);

    expect(result).toStrictEqual(expected);
  });

  it('should preserve complex expressions', () => {
    const expressions = [
      {
        key:      'baz',
        operator: 'In',
        values:   ['bat', 'baz']
      },
      {
        key:      'qux',
        operator: 'Exists'
      }
    ];
    const input = [
      {
        key:      'foo',
        operator: 'In',
        values:   ['bar']
      },
      ...expressions
    ];
    const expected = {
      matchLabels:      { foo: 'bar' },
      matchExpressions: expressions,
    };

    const result = simplify(input);

    expect(result).toStrictEqual(expected);
  });

  it('should preserve  duplicate keys', () => {
    const expressions = [
      {
        key:      'baz',
        operator: 'In',
        values:   ['bat']
      },
      {
        key:      'baz',
        operator: 'In',
        values:   ['qux']
      }
    ];

    const input = [
      {
        key:      'foo',
        operator: 'In',
        values:   ['bar']
      },
      ...expressions
    ];
    const expected = {
      matchLabels:      { foo: 'bar' },
      matchExpressions: expressions,
    };

    const result = simplify(input);

    expect(result).toStrictEqual(expected);
  });
});

describe('fx: matches', () => {
  const none = { metadata: { name: 'none', labels: {} } };
  const a = { metadata: { name: 'a', labels: { a: '1' } } };
  const b = { metadata: { name: 'b', labels: { b: '2' } } };
  const ab = { metadata: { name: 'ab', labels: { a: '3', b: '4' } } };

  it.each([
    // Match Exists
    ['a', [a, ab]],
    ['b', [b, ab]],
    ['c', []],

    // Match NotExists
    ['!a', [none, b]],
    ['!b', [none, a]],
    ['!c', [none, a, b, ab]],

    // Match Equal
    ['a=1', [a]],
    ['a=2', []],
    ['a=3', [ab]],

    ['b==1', []],
    ['b==2', [b]],
    ['b==3', []],
    ['b==4', [ab]],

    ['c=1', []],
    ['c=2', []],

    // Match Not Equal
    ['a!=1', [none, b, ab]],
    ['a!=2', [none, a, b, ab]],
    ['a!=3', [none, a, b]],

    ['b!=1', [none, a, b, ab]],
    ['b!=2', [none, a, ab]],
    ['b!=3', [none, a, b, ab]],
    ['b!=4', [none, a, b]],

    ['c!=1', [none, a, b, ab]],
    ['c!=2', [none, a, b, ab]],

    // Match In
    ['a in (1,2)', [a]],
    ['a in (1,3)', [a, ab]],
    ['a in (2,3)', [ab]],

    ['b in (2,3)', [b]],
    ['b in (2,4)', [b, ab]],
    ['b in (3,4)', [ab]],

    ['c in (1,2,3,4)', []],

    // Match Not In
    ['a notin (1,2)', [none, b, ab]],
    ['a notin (1,3)', [none, b]],
    ['a notin (2,3)', [none, a, b]],

    ['b notin (2,3)', [none, a, ab]],
    ['b notin (2,4)', [none, a]],
    ['b notin (3,4)', [none, a, b]],

    ['c notin (1,2,3,4)', [none, a, b, ab]],

    // Match Gt
    ['a > 0', [a, ab]],
    ['a > 2', [ab]],
    ['a > 4', []],

    // Match Lt
    ['a < 0', []],
    ['a < 2', [a]],
    ['a < 4', [a, ab]],

    // Match matchLabels object
    [{ a: '1' }, [a]],

    // Match matchExpressions array
    [
      [{
        key: 'a', operator: 'In', values: ['1']
      }], [a]
    ],

    // Handle garbage in
    [42, []],
    ['a ~ 1', []],
  ])('should return matched condition if %p matches', (cond, expected) => {
    const data = [none, a, b, ab];
    const result = matching(data, cond);

    expect(result).toStrictEqual(expected);
  });
});

describe('fx: matching', () => {
});
