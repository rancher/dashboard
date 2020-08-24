import test from 'ava';
import { parse, matching } from '@/utils/selector';

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

    'foo==bar':                     e1,
    'foo== bar':                    e1,
    'foo ==bar':                    e1,
    'foo == bar':                   e1,
    '  foo  ==  bar  ':             e1,

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
    'some.prefix/foo Not In(bar)':       e1,
    'some.prefix/foo NotIn(bar)':        e1,

    'bar+NOTIN+(bar,baz)':    e2,
    'bar notin (bar,baz)':    e2,
    'bar not in (bar,baz)':   e2,
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

const none = { metadata: { name: 'none', labels: {} } };
const a = { metadata: { name: 'a', labels: { a: '1' } } };
const b = { metadata: { name: 'b', labels: { b: '2' } } };
const ab = { metadata: { name: 'ab', labels: { a: '3', b: '4' } } };
const data = [none, a, b, ab];

function check(t, cond, expect) {
  const actual = matching(data, cond);

  t.deepEqual(actual, expect);
}

test('Match Exists', (t) => {
  check(t, 'a', [a, ab]);
  check(t, 'b', [b, ab]);
  check(t, 'c', []);
});

test('Match NotExists', (t) => {
  check(t, '!a', [none, b]);
  check(t, '!b', [none, a]);
  check(t, '!c', [none, a, b, ab]);
});

test('Match Equal', (t) => {
  check(t, 'a=1', [a]);
  check(t, 'a=2', []);
  check(t, 'a=3', [ab]);

  check(t, 'b==1', []);
  check(t, 'b==2', [b]);
  check(t, 'b==3', []);
  check(t, 'b==4', [ab]);

  check(t, 'c=1', []);
  check(t, 'c=2', []);
});

test('Match Not Equal', (t) => {
  check(t, 'a!=1', [none, b, ab]);
  check(t, 'a!=2', [none, a, b, ab]);
  check(t, 'a!=3', [none, a, b]);

  check(t, 'b!=1', [none, a, b, ab]);
  check(t, 'b!=2', [none, a, ab]);
  check(t, 'b!=3', [none, a, b, ab]);
  check(t, 'b!=4', [none, a, b]);

  check(t, 'c!=1', [none, a, b, ab]);
  check(t, 'c!=2', [none, a, b, ab]);
});

test('Match In', (t) => {
  check(t, 'a in (1,2)', [a]);
  check(t, 'a in (1,3)', [a, ab]);
  check(t, 'a in (2,3)', [ab]);

  check(t, 'b in (2,3)', [b]);
  check(t, 'b in (2,4)', [b, ab]);
  check(t, 'b in (3,4)', [ab]);

  check(t, 'c in (1,2,3,4)', []);
});

test('Match Not In', (t) => {
  check(t, 'a notin (1,2)', [none, b, ab]);
  check(t, 'a notin (1,3)', [none, b]);
  check(t, 'a notin (2,3)', [none, a, b]);

  check(t, 'b notin (2,3)', [none, a, ab]);
  check(t, 'b notin (2,4)', [none, a]);
  check(t, 'b notin (3,4)', [none, a, b]);

  check(t, 'c notin (1,2,3,4)', [none, a, b, ab]);
});
