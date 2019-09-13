import Queue from './queue';

export function allHash(hash) {
  const keys = Object.keys(hash);
  const promises = Object.values(hash);

  return Promise.all(promises).then((res) => {
    const out = {};

    for ( let i = 0 ; i < keys.length ; i++ ) {
      out[keys[i]] = res[i];
    }

    return out;
  });
}

export function eachLimit(items, limit, iterator, debug = false) {
  if (debug) {
    console.log('eachLimit of', items.length, ' items', limit, 'at a time');
  }

  return new Promise((resolve, reject) => {
    const queue = new Queue();
    let pending = 0;
    let failed = false;
    const out = [];

    for (let i = 0; i < items.length; i++) {
      queue.enqueue({ item: items[i], idx: i });
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
        return resolve(out);
      }

      while (!queue.isEmpty() && pending < limit && !failed) {
        const { item, idx } = queue.dequeue();

        if (debug) {
          console.log('Running', item);
        }

        pending++;

        iterator(item, idx).then((res) => {
          if (debug) {
            console.log('Done', item);
          }

          out[idx] = res;

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
