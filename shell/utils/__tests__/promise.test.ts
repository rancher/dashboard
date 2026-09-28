import Queue from '@shell/utils/queue';
import {
  allHash,
  allHashSettled,
  deferred,
  eachLimit,
  setPromiseResult,
} from '@shell/utils/promise';

describe('queue', () => {
  describe('getLength', () => {
    it.each([
      {
        desc: '0 for an empty queue', enqueueCount: 0, dequeueCount: 0, expected: 0
      },
      {
        desc: '1 after one enqueue', enqueueCount: 1, dequeueCount: 0, expected: 1
      },
      {
        desc: 'decrements after dequeue', enqueueCount: 2, dequeueCount: 1, expected: 1
      },
    ])('returns $desc', ({ enqueueCount, dequeueCount, expected }) => {
      const q = new Queue();

      for (let i = 0; i < enqueueCount; i++) {
        q.enqueue(`item-${ i }`);
      }
      for (let i = 0; i < dequeueCount; i++) {
        q.dequeue();
      }

      expect(q.getLength()).toStrictEqual(expected);
    });
  });

  describe('isEmpty', () => {
    it.each([
      {
        desc: 'true when queue is empty', enqueueCount: 0, dequeueCount: 0, expected: true
      },
      {
        desc: 'false after enqueueing an item', enqueueCount: 1, dequeueCount: 0, expected: false
      },
      {
        desc: 'true after all items are dequeued', enqueueCount: 1, dequeueCount: 1, expected: true
      },
    ])('returns $desc', ({ enqueueCount, dequeueCount, expected }) => {
      const q = new Queue();

      for (let i = 0; i < enqueueCount; i++) {
        q.enqueue('x');
      }
      for (let i = 0; i < dequeueCount; i++) {
        q.dequeue();
      }

      expect(q.isEmpty()).toStrictEqual(expected);
    });
  });

  describe('enqueue / dequeue', () => {
    it('dequeues items in FIFO order', () => {
      const q = new Queue();

      q.enqueue('first');
      q.enqueue('second');
      q.enqueue('third');

      expect(q.dequeue()).toStrictEqual('first');
      expect(q.dequeue()).toStrictEqual('second');
      expect(q.dequeue()).toStrictEqual('third');
    });

    it('returns undefined when dequeuing from an empty queue', () => {
      const q = new Queue();

      expect(q.dequeue()).toBeUndefined();
    });

    it('works with objects as items', () => {
      const q = new Queue();
      const item = { key: 'value' };

      q.enqueue(item);
      expect(q.dequeue()).toStrictEqual(item);
    });
  });

  describe('peek', () => {
    it.each([
      {
        desc: 'the front item without removing it', items: ['a', 'b'], expected: 'a'
      },
      {
        desc: 'undefined when queue is empty', items: [] as string[], expected: undefined
      },
    ])('returns $desc', ({ items, expected }) => {
      const q = new Queue();

      items.forEach((item) => q.enqueue(item));

      expect(q.peek()).toStrictEqual(expected);
      expect(q.getLength()).toStrictEqual(items.length);
    });
  });

  describe('clear', () => {
    it('empties the queue', () => {
      const q = new Queue();

      q.enqueue('a');
      q.enqueue('b');
      q.clear();

      expect(q.isEmpty()).toStrictEqual(true);
      expect(q.getLength()).toStrictEqual(0);
    });

    it('allows re-use after clear', () => {
      const q = new Queue();

      q.enqueue('a');
      q.clear();
      q.enqueue('b');

      expect(q.dequeue()).toStrictEqual('b');
    });
  });
});

describe('allHash', () => {
  it('resolves a hash of resolved promises', async() => {
    const result = await allHash({
      a: Promise.resolve(1),
      b: Promise.resolve(2),
      c: Promise.resolve(3),
    });

    expect(result).toStrictEqual({
      a: 1,
      b: 2,
      c: 3,
    });
  });

  it('rejects if any promise in the hash rejects', async() => {
    await expect(
      allHash({
        a: Promise.resolve(1),
        b: Promise.reject(new Error('fail')),
      })
    ).rejects.toThrow('fail');
  });

  it('returns an empty object for an empty hash', async() => {
    const result = await allHash({});

    expect(result).toStrictEqual({});
  });

  it('preserves key ordering from the input hash', async() => {
    const result = await allHash({
      z: Promise.resolve('z-val'),
      a: Promise.resolve('a-val'),
    });

    expect(Object.keys(result)).toStrictEqual(['z', 'a']);
    expect(result).toStrictEqual({ z: 'z-val', a: 'a-val' });
  });

  it('resolves non-promise values in the hash', async() => {
    const result = await allHash({ x: 42 });

    expect(result).toStrictEqual({ x: 42 });
  });
});

describe('allHashSettled', () => {
  it('resolves with fulfilled/rejected statuses for each key', async() => {
    const result = await allHashSettled({
      ok:  Promise.resolve('success'),
      err: Promise.reject(new Error('oops')),
    });

    expect(result.ok).toStrictEqual({ status: 'fulfilled', value: 'success' });
    expect(result.err.status).toStrictEqual('rejected');
    expect((result.err as PromiseRejectedResult).reason.message).toStrictEqual('oops');
  });

  it('returns an empty object for an empty hash', async() => {
    const result = await allHashSettled({});

    expect(result).toStrictEqual({});
  });

  it('never rejects — always resolves even when all promises fail', async() => {
    await expect(
      allHashSettled({
        a: Promise.reject(new Error('a-fail')),
        b: Promise.reject(new Error('b-fail')),
      })
    ).resolves.toBeDefined();
  });
});

describe('eachLimit', () => {
  it('processes all items and returns results in index order', async() => {
    const items = [1, 2, 3, 4, 5];
    const result = await eachLimit(items, 2, (item: number) => Promise.resolve(item * 10));

    expect(result).toStrictEqual([10, 20, 30, 40, 50]);
  });

  it('returns an empty array for empty input', async() => {
    const result = await eachLimit([], 3, () => Promise.resolve('x'));

    expect(result).toStrictEqual([]);
  });

  it('rejects if any iterator rejects', async() => {
    await expect(
      eachLimit([1, 2, 3], 2, (item: number) => {
        if (item === 2) {
          return Promise.reject(new Error('item-2-failed'));
        }

        return Promise.resolve(item);
      })
    ).rejects.toThrow('item-2-failed');
  });

  it('handles limit larger than the number of items', async() => {
    const items = ['a', 'b'];
    const result = await eachLimit(items, 100, (item: string) => Promise.resolve(`done-${ item }`));

    expect(result).toStrictEqual(['done-a', 'done-b']);
  });

  it('handles limit of 1 (sequential processing)', async() => {
    const order: number[] = [];
    const items = [1, 2, 3];

    await eachLimit(items, 1, (item: number) => {
      order.push(item);

      return Promise.resolve(item);
    });

    expect(order).toStrictEqual([1, 2, 3]);
  });

  it('respects the concurrency limit', async() => {
    let concurrent = 0;
    let maxConcurrent = 0;
    const limit = 2;
    const items = [1, 2, 3, 4, 5];

    await eachLimit(items, limit, (item: number) => {
      concurrent++;
      if (concurrent > maxConcurrent) {
        maxConcurrent = concurrent;
      }

      return new Promise<number>((resolve) => {
        setTimeout(() => {
          concurrent--;
          resolve(item);
        }, 5);
      });
    });

    expect(maxConcurrent).toStrictEqual(limit);
  });

  it('passes the item index as the second argument to the iterator', async() => {
    const indices: number[] = [];

    await eachLimit(['x', 'y', 'z'], 3, (_item: string, idx: number) => {
      indices.push(idx);

      return Promise.resolve(idx);
    });

    expect(indices).toStrictEqual([0, 1, 2]);
  });
});

describe('deferred', () => {
  it('returns an object with promise, resolve, and reject', () => {
    const d = deferred('test');

    expect(d.promise).toBeInstanceOf(Promise);
    expect(typeof d.resolve).toStrictEqual('function');
    expect(typeof d.reject).toStrictEqual('function');
  });

  it('resolves the promise when resolve is called', async() => {
    const d = deferred('resolve-test');

    d.resolve('resolved-value');

    await expect(d.promise).resolves.toStrictEqual('resolved-value');
  });

  it('rejects the promise when reject is called', async() => {
    const d = deferred('reject-test');

    d.reject(new Error('deferred-error'));

    await expect(d.promise).rejects.toThrow('deferred-error');
  });
});

describe('setPromiseResult', () => {
  it('sets the resolved value on the target object property', async() => {
    const obj: { result?: string } = {};

    setPromiseResult(Promise.resolve('hello'), obj, 'result', 'test label');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(obj.result).toStrictEqual('hello');
  });

  it('does not throw when the promise rejects — logs a warning instead', async() => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const obj: { value?: string } = {};

    setPromiseResult(Promise.reject(new Error('boom')), obj, 'value', 'failing label');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(obj.value).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith('Failed to: ', 'failing label', expect.any(Error));
    warnSpy.mockRestore();
  });

  it('leaves the object property unchanged when the promise rejects', async() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const obj: { data: string } = { data: 'original' };

    setPromiseResult(Promise.reject(new Error('err')), obj, 'data', 'test');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(obj.data).toStrictEqual('original');
    jest.restoreAllMocks();
  });
});
