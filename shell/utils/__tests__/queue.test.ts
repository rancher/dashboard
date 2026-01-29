import Queue from '@shell/utils/queue';

describe('class: Queue', () => {
  let queue: any;

  beforeEach(() => {
    queue = new Queue();
  });

  describe('constructor', () => {
    it('should create empty queue', () => {
      expect(queue.getLength()).toBe(0);
      expect(queue.isEmpty()).toBe(true);
    });

    it('should initialize offset to 0', () => {
      expect(queue.offset).toBe(0);
    });
  });

  describe('getLength', () => {
    it('should return 0 for empty queue', () => {
      expect(queue.getLength()).toBe(0);
    });

    it('should return correct length after enqueue', () => {
      queue.enqueue('item1');
      queue.enqueue('item2');

      expect(queue.getLength()).toBe(2);
    });

    it('should return correct length after dequeue', () => {
      queue.enqueue('item1');
      queue.enqueue('item2');
      queue.dequeue();

      expect(queue.getLength()).toBe(1);
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty queue', () => {
      expect(queue.isEmpty()).toBe(true);
    });

    it('should return false after enqueue', () => {
      queue.enqueue('item');

      expect(queue.isEmpty()).toBe(false);
    });

    it('should return true after dequeueing all items', () => {
      queue.enqueue('item');
      queue.dequeue();

      expect(queue.isEmpty()).toBe(true);
    });
  });

  describe('enqueue', () => {
    it('should add item to queue', () => {
      queue.enqueue('item');

      expect(queue.getLength()).toBe(1);
    });

    it('should add multiple items in order', () => {
      queue.enqueue('first');
      queue.enqueue('second');
      queue.enqueue('third');

      expect(queue.peek()).toBe('first');
    });

    it('should handle different data types', () => {
      queue.enqueue(123);
      queue.enqueue({ key: 'value' });
      queue.enqueue(['array']);
      queue.enqueue(null);

      expect(queue.getLength()).toBe(4);
    });
  });

  describe('dequeue', () => {
    it('should return undefined for empty queue', () => {
      expect(queue.dequeue()).toBeUndefined();
    });

    it('should return first item added (FIFO)', () => {
      queue.enqueue('first');
      queue.enqueue('second');

      expect(queue.dequeue()).toBe('first');
    });

    it('should remove item from queue', () => {
      queue.enqueue('item');

      queue.dequeue();

      expect(queue.getLength()).toBe(0);
    });

    it('should return items in FIFO order', () => {
      queue.enqueue('first');
      queue.enqueue('second');
      queue.enqueue('third');

      expect(queue.dequeue()).toBe('first');
      expect(queue.dequeue()).toBe('second');
      expect(queue.dequeue()).toBe('third');
    });

    it('should compact internal array when offset exceeds half length', () => {
      queue.enqueue('item1');
      queue.enqueue('item2');
      queue.dequeue();

      expect(queue.offset).toBe(0);
      expect(queue.queue).toHaveLength(1);
    });
  });

  describe('peek', () => {
    it('should return undefined for empty queue', () => {
      expect(queue.peek()).toBeUndefined();
    });

    it('should return first item without removing it', () => {
      queue.enqueue('first');
      queue.enqueue('second');

      expect(queue.peek()).toBe('first');
      expect(queue.getLength()).toBe(2);
    });

    it('should return same item on multiple peeks', () => {
      queue.enqueue('item');

      expect(queue.peek()).toBe('item');
      expect(queue.peek()).toBe('item');
      expect(queue.peek()).toBe('item');
    });
  });

  describe('clear', () => {
    it('should empty the queue', () => {
      queue.enqueue('item1');
      queue.enqueue('item2');

      queue.clear();

      expect(queue.isEmpty()).toBe(true);
      expect(queue.getLength()).toBe(0);
    });

    it('should reset offset to 0', () => {
      queue.enqueue('item1');
      queue.enqueue('item2');
      queue.enqueue('item3');
      queue.dequeue();

      queue.clear();

      expect(queue.offset).toBe(0);
    });

    it('should allow reuse after clear', () => {
      queue.enqueue('old');
      queue.clear();
      queue.enqueue('new');

      expect(queue.peek()).toBe('new');
      expect(queue.getLength()).toBe(1);
    });
  });

  describe('fifo behavior', () => {
    it('should maintain FIFO order with interleaved operations', () => {
      queue.enqueue('a');
      queue.enqueue('b');
      expect(queue.dequeue()).toBe('a');

      queue.enqueue('c');
      expect(queue.dequeue()).toBe('b');

      queue.enqueue('d');
      expect(queue.dequeue()).toBe('c');
      expect(queue.dequeue()).toBe('d');
    });

    it('should handle large number of items', () => {
      for (let i = 0; i < 1000; i++) {
        queue.enqueue(i);
      }

      expect(queue.getLength()).toBe(1000);

      for (let i = 0; i < 1000; i++) {
        expect(queue.dequeue()).toBe(i);
      }

      expect(queue.isEmpty()).toBe(true);
    });
  });
});
