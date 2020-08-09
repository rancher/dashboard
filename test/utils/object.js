import test from 'ava';
import { get, getter, clone, isEmpty } from '@/utils/object';

const obj = { foo: 'bar', baz: { bat: 42, 'with.dots': 43 } };

test('get', (t) => {
  t.deepEqual( get(obj, 'foo'), obj.foo, 'Gets single keys');
  t.deepEqual( get(obj, 'baz.bat'), obj.baz.bat, 'Gets nested keys');
  t.deepEqual( get(obj, "baz.'with.dots'"), obj.baz['with.dots'], 'Even with dots in them');
  t.deepEqual( get(obj, 'baz.nonsense'), undefined, 'Returns undefined for nonexistent leaf ');
  t.deepEqual( get(obj, 'non.sense'), undefined, 'Returns undefined for nonexistent parent ');
});

test('getter', (t) => {
  let g = getter('foo');

  t.deepEqual( typeof g, 'function', 'Returns a function');

  t.deepEqual( g(obj), obj.foo, 'Gets single keys');

  g = getter('baz.bat');

  t.deepEqual( g(obj), obj.baz.bat, 'Gets nested keys');

  g = getter('baz."with.dots"');

  t.deepEqual( g(obj), obj.baz['with.dots'], 'Gets dotted keys');
});

test('clone', (t) => {
  const c = clone(obj);

  t.not(c, obj, 'Returns a different object');

  t.deepEqual(c, obj, 'With the same value');
});

test('isEmpty', (t) => {
  t.true(isEmpty({}), 'Says empty things are empty');
  t.false(isEmpty({ foo: 42 }), 'Says not-empty things are not empty');

  const x = {};

  Object.defineProperty(x, 'foo', { value: 'bar' });

  t.true(isEmpty(x), 'Ignores non-enumerable properties');

  Object.defineProperty(x, 'baz', { value: 'bar', enumerable: true });

  t.false(isEmpty(x), 'Sees enumerable properties');
});
