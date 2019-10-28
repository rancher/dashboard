import test from 'ava';
import { get, getter, clone } from '@/utils/object';

const obj = { foo: 'bar', baz: { bat: 42 } };

test('get', (t) => {
  t.deepEqual( get(obj, 'foo'), obj.foo, 'Gets single keys');
  t.deepEqual( get(obj, 'baz.bat'), obj.baz.bat, 'Gets nested keys');
  t.deepEqual( get(obj, 'baz.nonsense'), undefined, 'Returns undefined for nonexistent leaf ');
  t.deepEqual( get(obj, 'non.sense'), undefined, 'Returns undefined for nonexistent parent ');
});

test('getter', (t) => {
  let g = getter('foo');

  t.deepEqual( typeof g, 'function', 'Returns a function');

  t.deepEqual( g(obj), obj.foo, 'Gets single keys');

  g = getter('baz.bat');

  t.deepEqual( g(obj), obj.baz.bat, 'Gets nested keys');
});

test('clone', (t) => {
  const c = clone(obj);

  t.not(c, obj, 'Returns a different object');

  t.deepEqual(c, obj, 'With the same value');
});
