import test from 'ava';
import {
  addObject, addObjects, removeObject, removeObjects, isArray, removeAt
} from '@/utils/array';

const obj1 = { foo: 'bar' };
const obj2 = { foo: 'baz' };
const obj3 = { foo: 'bat' };
const obj4 = { foo: 'qux' };

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
