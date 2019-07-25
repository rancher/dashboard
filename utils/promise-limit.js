import Queue from './queue';

export function eachLimit(items, limit, iterator, debug = false) {
  if (debug) {
    console.log('eachLimit of', items.length, ' items', limit, 'at a time');
  }

  return new Promise((resolve, reject) => {
    const queue = new Queue();
    let pending = 0;
    let failed = false;

    for (let i = 0; i < items.length; i++) {
      queue.enqueue(items[i]);
    }

    process();

    function process() {
      if (debug) {
        console.log(`process, queue=${ queue.getLength() }, pending=${ pending }, failed=${ failed }`);
      }

      if (failed) {
        return;
      }

      if (queue.isEmpty() && pending === 0) {
        return resolve();
      }

      while (!queue.isEmpty() && pending < limit && !failed) {
        const item = queue.dequeue();

        if (debug) {
          console.log('Running', item);
        }

        pending++;

        iterator(item).then(() => {
          if (debug) {
            console.log('Done', item);
          }

          pending--;
          process();
        }).catch((err) => {
          if (debug) {
            console.log('Failed', err, item);
          }

          failed = true;
          reject(err);
        });
      }
    }
  });
}
