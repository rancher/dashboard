import test from 'ava';
import {
  addObject, addObjects,
  removeObject, removeObjects, removeAt, clear,
  isArray,
  filterBy, findBy
} from '@/utils/array';

const obj1 = { foo: 'bar' };
const obj2 = { foo: 'baz', bar: false };
const obj3 = { foo: 'bat', baz: 'bat' };
const obj4 = { foo: 'qux', bar: true };

test('addObject', (t) => {
  const ary = [];

  addObject(ary, obj1);
  t.deepEqual(ary, [obj1], 'Adds what I asked for');

  addObject(ary, obj2);
  t.deepEqual(ary, [obj1, obj2], 'Leaves what was there and adds more');

  addObject(ary, obj2);
  t.deepEqual(ary, [obj1, obj2], "Doesn't add duplicates");
});

test('addObjects', (t) => {
  const ary = [obj1];

  addObjects(ary, [obj2, obj3]);
  t.deepEqual(ary, [obj1, obj2, obj3], 'Adds multiple');

  addObjects(ary, []);
  t.deepEqual(ary, [obj1, obj2, obj3], 'Accepts nothing');

  addObjects(ary, [obj1, obj4]);
  t.deepEqual(ary, [obj1, obj2, obj3, obj4], "Doesn't add duplicates");
});

test('removeObject', (t) => {
  const ary = [obj1, obj2, obj3];

  removeObject(ary, obj2);
  t.deepEqual(ary, [obj1, obj3], 'Removes');

  removeObject(ary, obj4);
  t.deepEqual(ary, [obj1, obj3], "Doesn't remove something that's not there");

  removeObject(ary, obj1);
  removeObject(ary, obj3);
  t.is(ary.length, 0, 'Goes to empty');
});

test('removeObjects', (t) => {
  const ary = [obj1, obj2, obj3];

  removeObjects(ary, [obj2]);
  t.deepEqual(ary, [obj1, obj3], 'Removes');

  removeObject(ary, [obj4]);
  t.deepEqual(ary, [obj1, obj3], "Doesn't remove something that's not there");

  removeObjects(ary, [obj1, obj3]);
  t.is(ary.length, 0, 'Goes to empty');
});

test('isArray', (t) => {
  const tests = [
    { val: [], expect: true },
    { val: true, expect: false },
    { val: 42, expect: false },
    { val: {}, expect: false },
    { val: { length: 42 }, expect: false },
  ];

  tests.forEach((c) => {
    t.is(isArray(c.val), c.expect);
  });
});

test('removeAt', (t) => {
  const ary = [obj1, obj2, obj3, obj4];

  function tooHigh() {
    removeAt(ary, 42);
  }
  t.throws(tooHigh, null, 'Throws bad indexes high');

  function tooLow() {
    removeAt(ary, -1);
  }
  t.throws(tooLow, null, 'Throws bad indexes low');

  removeAt(ary, 1);
  t.deepEqual(ary, [obj1, obj3, obj4], 'Removes');

  removeAt(ary, 1, 2);
  t.deepEqual(ary, [obj1], 'Removes multiple');

  removeAt(ary, 0);
  t.deepEqual(ary, [], 'Removes the last');

  function empty() {
    removeAt(ary, 0);
  }
  t.throws(empty, null, 'Throws on empty');
});

test('clear', (t) => {
  const ary = [obj1, obj2, obj3, obj4];
  const copy = ary;

  clear(ary);
  t.is(ary.length, 0, "It's empty now");
  t.is(ary, copy, "It's still the same aray");
});

test('filterBy', (t) => {
  const ary = [obj1, obj2, obj3, obj4];
  let out;

  out = filterBy(null, { foo: 'bar' });
  t.deepEqual(out, [], 'Accepts empty input');

  out = filterBy(ary, 'bar');
  t.not(out, ary, 'Returns a different object');
  t.deepEqual(out, [obj4], 'Finds items with value truthiness');

  out = filterBy(ary, 'baz');
  t.deepEqual(out, [obj3], 'Finds items with string truthiness');

  out = filterBy(ary, 'bar', false);
  t.deepEqual(out, [obj2], 'Finds items with falsey values');

  out = filterBy(ary, 'foo', 'bar');
  t.deepEqual(out, [obj1], 'Finds items with string values');

  out = filterBy(ary, { foo: 'qux', bar: true });
  t.deepEqual(out, [obj4], 'Finds items with multiple conditions');

  out = filterBy(ary, { bar: undefined });
  t.deepEqual(out, [obj4], 'Finds items with object truthiness');

  out = filterBy(ary, { foo: 'qux', bar: false });
  t.not(out, ary, 'Returns a different object');
  t.deepEqual(out, [], 'Finds no matches');
});

test('findBy', (t) => {
  const ary = [obj1, obj2, obj3, obj4];
  let out;

  out = findBy(null, { foo: 'bar' });
  t.is(out, undefined, 'Accepts empty input');

  out = findBy(ary, 'bar');
  t.is(out, obj4, 'Finds items with value truthiness');

  out = findBy(ary, 'baz');
  t.is(out, obj3, 'Finds items with string truthiness');

  out = findBy(ary, 'bar', false);
  t.is(out, obj2, 'Finds items with falsey values');

  out = findBy(ary, 'foo', 'bar');
  t.is(out, obj1, 'Finds items with string values');

  out = findBy(ary, { foo: 'qux', bar: true });
  t.is(out, obj4, 'Finds items with multiple conditions');

  out = findBy(ary, { bar: undefined });
  t.is(out, obj4, 'Finds items with object truthiness');

  out = findBy(ary, { foo: 'qux', bar: false });
  t.is(out, undefined, 'Finds no matches');
});
