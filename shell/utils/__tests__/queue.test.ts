import Queue from '@shell/utils/queue';

describe('queue', () => {
  describe('new queue', () => {
    it('starts with length 0', () => {
      const q = new Queue();

      expect(q.getLength()).toStrictEqual(0);
    });

    it('starts empty', () => {
      const q = new Queue();

      expect(q.isEmpty()).toStrictEqual(true);
    });

    it('peek returns undefined on empty queue', () => {
      const q = new Queue();

      expect(q.peek()).toBeUndefined();
    });

    it('dequeue returns undefined on empty queue', () => {
      const q = new Queue();

      expect(q.dequeue()).toBeUndefined();
    });
  });

  describe('enqueue', () => {
    it('increases length by 1', () => {
      const q = new Queue();

      q.enqueue('a');
      expect(q.getLength()).toStrictEqual(1);
    });

    it('marks queue as non-empty after first item', () => {
      const q = new Queue();

      q.enqueue('x');
      expect(q.isEmpty()).toStrictEqual(false);
    });

    it('accepts arbitrary values', () => {
      const q = new Queue();

      q.enqueue(42);
      q.enqueue(null);
      q.enqueue({ key: 'val' });
      expect(q.getLength()).toStrictEqual(3);
    });
  });

  describe('dequeue', () => {
    it('returns the enqueued item', () => {
      const q = new Queue();

      q.enqueue('hello');
      expect(q.dequeue()).toStrictEqual('hello');
    });

    it('decreases length by 1', () => {
      const q = new Queue();

      q.enqueue('a');
      q.enqueue('b');
      q.dequeue();
      expect(q.getLength()).toStrictEqual(1);
    });

    it('empties the queue when last item is removed', () => {
      const q = new Queue();

      q.enqueue('only');
      q.dequeue();
      expect(q.isEmpty()).toStrictEqual(true);
      expect(q.getLength()).toStrictEqual(0);
    });

    it('maintains FIFO order', () => {
      const q = new Queue();

      q.enqueue('first');
      q.enqueue('second');
      q.enqueue('third');

      expect(q.dequeue()).toStrictEqual('first');
      expect(q.dequeue()).toStrictEqual('second');
      expect(q.dequeue()).toStrictEqual('third');
    });

    it('returns undefined after queue is drained', () => {
      const q = new Queue();

      q.enqueue('item');
      q.dequeue();
      expect(q.dequeue()).toBeUndefined();
    });
  });

  describe('peek', () => {
    it('returns the front item without removing it', () => {
      const q = new Queue();

      q.enqueue('front');
      q.enqueue('back');
      expect(q.peek()).toStrictEqual('front');
    });

    it('does not change the queue length', () => {
      const q = new Queue();

      q.enqueue('a');
      q.peek();
      expect(q.getLength()).toStrictEqual(1);
    });

    it('reflects the new front after a dequeue', () => {
      const q = new Queue();

      q.enqueue('first');
      q.enqueue('second');
      q.dequeue();
      expect(q.peek()).toStrictEqual('second');
    });
  });

  describe('clear', () => {
    it('empties a populated queue', () => {
      const q = new Queue();

      q.enqueue('a');
      q.enqueue('b');
      q.clear();
      expect(q.isEmpty()).toStrictEqual(true);
    });

    it('resets length to 0', () => {
      const q = new Queue();

      q.enqueue(1);
      q.enqueue(2);
      q.enqueue(3);
      q.clear();
      expect(q.getLength()).toStrictEqual(0);
    });

    it('allows enqueue after clear', () => {
      const q = new Queue();

      q.enqueue('before');
      q.clear();
      q.enqueue('after');
      expect(q.dequeue()).toStrictEqual('after');
    });

    it('is safe to call on an already-empty queue', () => {
      const q = new Queue();

      q.clear();
      expect(q.isEmpty()).toStrictEqual(true);
      expect(q.getLength()).toStrictEqual(0);
    });
  });

  describe('mixed operations', () => {
    it('handles interleaved enqueue and dequeue correctly', () => {
      const q = new Queue();

      q.enqueue('a');
      q.enqueue('b');
      expect(q.dequeue()).toStrictEqual('a');
      q.enqueue('c');
      expect(q.dequeue()).toStrictEqual('b');
      expect(q.dequeue()).toStrictEqual('c');
      expect(q.isEmpty()).toStrictEqual(true);
    });

    it('tracks length correctly through mixed operations', () => {
      const q = new Queue();

      q.enqueue(1);
      q.enqueue(2);
      q.enqueue(3);
      expect(q.getLength()).toStrictEqual(3);

      q.dequeue();
      expect(q.getLength()).toStrictEqual(2);

      q.enqueue(4);
      expect(q.getLength()).toStrictEqual(3);

      q.dequeue();
      q.dequeue();
      expect(q.getLength()).toStrictEqual(1);
    });

    it('compacts the backing array when threshold is reached', () => {
      // The implementation slices when ++offset * 2 >= queue.length.
      // With 4 items: after the 2nd dequeue offset*2 (4) reaches length (4),
      // triggering a compaction so the backing array is reset.
      const q = new Queue();

      q.enqueue('w');
      q.enqueue('x');
      q.enqueue('y');
      q.enqueue('z');

      expect(q.dequeue()).toStrictEqual('w'); // offset=1, 1*2=2 < 4 — no compaction yet
      expect(q.dequeue()).toStrictEqual('x'); // offset=2, 2*2=4 >= 4 — compaction!
      // After compaction: backing array = ['y','z'], offset=0
      expect(q.getLength()).toStrictEqual(2);
      expect(q.peek()).toStrictEqual('y');
      expect(q.dequeue()).toStrictEqual('y');
      expect(q.dequeue()).toStrictEqual('z');
      expect(q.isEmpty()).toStrictEqual(true);
    });

    it('enqueues object values and preserves them through FIFO', () => {
      const q = new Queue();
      const obj1 = { id: 1, name: 'first' };
      const obj2 = { id: 2, name: 'second' };

      q.enqueue(obj1);
      q.enqueue(obj2);

      expect(q.dequeue()).toStrictEqual({ id: 1, name: 'first' });
      expect(q.dequeue()).toStrictEqual({ id: 2, name: 'second' });
    });
  });
});
