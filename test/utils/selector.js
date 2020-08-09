import test from 'ava';
import { parse } from '@/utils/selector';

test('Parse equals', (t) => {
  const e1 = {
    key:      'foo',
    operator: 'In',
    values:   ['bar']
  };

  const e2 = {
    key:      'some.prefix/foo',
    operator: 'In',
    values:   ['bar']
  };

  const cases = {
    'foo=bar':                     e1,
    'foo= bar':                    e1,
    'foo =bar':                    e1,
    'foo = bar':                   e1,
    '  foo  =  bar  ':             e1,

    'some.prefix/foo=bar':         e2,
    'some.prefix/foo= bar':        e2,
    'some.prefix/foo =bar':        e2,
    'some.prefix/foo = bar':       e2,
    '  some.prefix/foo  =  bar  ': e2,
  };

  for ( const c in cases ) {
    t.deepEqual(parse(c), [cases[c]]);
  }
});

test('Parse not equals', (t) => {
  const e1 = {
    key:      'foo',
    operator: 'NotIn',
    values:   ['bar']
  };

  const e2 = {
    key:      'some.prefix/foo',
    operator: 'NotIn',
    values:   ['bar']
  };

  const cases = {
    'foo!=bar':                     e1,
    'foo!= bar':                    e1,
    'foo !=bar':                    e1,
    'foo != bar':                   e1,
    '  foo  !=  bar  ':             e1,

    'some.prefix/foo!=bar':         e2,
    'some.prefix/foo!= bar':        e2,
    'some.prefix/foo !=bar':        e2,
    'some.prefix/foo != bar':       e2,
    '  some.prefix/foo  !=  bar  ': e2,
  };

  for ( const c in cases ) {
    t.deepEqual(parse(c), [cases[c]]);
  }
});

test('Parse exists', (t) => {
  const expect = { key: 'foo', operator: 'Exists' };

  t.deepEqual(parse('foo'), [expect]);
  t.deepEqual(parse(' foo'), [expect]);
  t.deepEqual(parse(' foo '), [expect]);

  t.deepEqual(parse(' some.prefix/foo-bar_baz '), [{ key: 'some.prefix/foo-bar_baz', operator: 'Exists' }]);
});

test('Parse not exists', (t) => {
  const e1 = { key: 'foo', operator: 'DoesNotExist' };
  const e2 = { key: 'some.prefix/foo-bar_baz', operator: 'DoesNotExist' };

  const cases = {
    '!foo':     e1,
    ' !foo':    e1,
    '! foo ':   e1,
    ' !  foo ': e1,

    '!some.prefix/foo-bar_baz ':    e2,
    '! some.prefix/foo-bar_baz ':   e2,
    ' !  some.prefix/foo-bar_baz ': e2,
  };

  for ( const c in cases ) {
    t.deepEqual(parse(c), [cases[c]]);
  }
});

test('Parse in', (t) => {
  const e1 = {
    key:      'foo',
    operator: 'In',
    values:   ['bar']
  };

  const e2 = {
    key:      'some.prefix/foo_bar',
    operator: 'In',
    values:   ['bar', 'baz']
  };

  const cases = {
    'foo in (bar)':       e1,
    '  foo IN ( bar )  ': e1,
    'foo in(bar)':        e1,

    'some.prefix/foo_bar+in+(bar,baz)':    e2,
    'some.prefix/foo_bar IN( bar , baz )': e2,
  };

  for ( const c in cases ) {
    t.deepEqual(parse(c), [cases[c]]);
  }
});

test('Parse notin', (t) => {
  const e1 = {
    key:      'some.prefix/foo',
    operator: 'NotIn',
    values:   ['bar']
  };

  const e2 = {
    key:      'bar',
    operator: 'NotIn',
    values:   ['bar', 'baz']
  };

  const cases = {
    'some.prefix/foo notin (bar)':       e1,
    '  some.prefix/foo NOTIN ( bar )  ': e1,
    'some.prefix/foo NotIn(bar)':        e1,

    'bar+NOTIN+(bar,baz)':    e2,
    'bar notin (bar,baz)':    e2,
    'bar notIn( bar , baz )': e2,
  };

  for ( const c in cases ) {
    t.deepEqual(parse(c), [cases[c]]);
  }
});

test('Parse compound', (t) => {
  const e = [
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

  const c = 'foo=bar,+bar notin (  baz,qux)  , some.domain/key, environment   IN  (production,  qa  )  ,!  another.domain/no-key';

  t.deepEqual(parse(c), e);
});
