import Queue from './queue';

/**
 * The values of a hash of promises, keyed the same way as the hash they came from.
 *
 * @typedef {Record<string, any>} ResolvedHash
 */

/**
 * The `PromiseSettledResult` of each promise in a hash, keyed the same way as the hash they came
 * from.
 *
 * @typedef {Record<string, PromiseSettledResult<any>>} SettledHash
 */

/**
 * Run `Promise[fnName]` over the values of `hash` and put the results back under the same keys.
 *
 * @param hash - An object whose values are promises. Non-promise values are passed through, since
 * that is what `Promise.all`/`Promise.allSettled` do with them.
 * @param {'all' | 'allSettled'} fnName - Which `Promise` combinator to use.
 * @returns {Promise<ResolvedHash>} The results, keyed as `hash` was.
 */
async function _hash(hash, fnName) {
  const keys = Object.keys(hash);
  const promises = Object.values(hash);

  const res = await Promise[fnName](promises);
  const out = {};

  for ( let i = 0 ; i < keys.length ; i++ ) {
    out[keys[i]] = res[i];
  }

  return out;
}

/**
 * Resolve every promise in `hash` and return their values keyed the same way. Rejects as soon as
 * any of them rejects.
 *
 * @param hash - An object whose values are the promises to resolve.
 * @returns {Promise<ResolvedHash>} The resolved value of each promise.
 */
export function allHash(hash) {
  return _hash(hash, 'all');
}

/**
 * Settle every promise in `hash` and return their `PromiseSettledResult`s keyed the same way.
 * Never rejects.
 *
 * @param hash - An object whose values are the promises to settle.
 * @returns {Promise<SettledHash>} The settled result of each promise, so `status` plus either
 * `value` or `reason`.
 */
export function allHashSettled(hash) {
  return _hash(hash, 'allSettled');
}

export function eachLimit(items, limit, iterator, debug = false) {
  if (debug) {
    console.log('eachLimit of', items.length, ' items', limit, 'at a time'); // eslint-disable-line no-console
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
        console.log(`process, queue=${ queue.getLength() }, pending=${ pending }, failed=${ failed }`); // eslint-disable-line no-console
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
          console.log('Running', item); // eslint-disable-line no-console
        }

        pending++;

        iterator(item, idx).then((res) => {
          if (debug) {
            console.log('Done', item); // eslint-disable-line no-console
          }

          out[idx] = res;

          pending--;
          process();
        }).catch((err) => {
          if (debug) {
            console.log('Failed', err, item); // eslint-disable-line no-console
          }

          failed = true;
          reject(err);
        });
      }
    }
  });
}

/**
 * A promise together with the two functions that settle it.
 *
 * @typedef {object} Deferred
 * @property {Promise<any>} promise - The promise being deferred.
 * @property {(value?: any) => void} resolve - Resolves `promise` with the given value.
 * @property {(reason?: any) => void} reject - Rejects `promise` with the given reason.
 */

/**
 * Create a promise whose settling is controlled from outside its executor.
 *
 * @param {string} [name] - Ignored. It is passed as the second argument to `new Promise`, which
 * native promises do not take; a leftover from when this used Bluebird. No production caller passes
 * it.
 * @returns {Deferred}
 */
export function deferred(name) {
  const out = {};

  out.promise = new Promise((resolve, reject) => {
    out.resolve = resolve;
    out.reject = reject;
  }, name);

  return out;
}

/**
 * Apply the result of a promise to a given object's property
 *
 * This is a non-blocking method
 *
 * @param promise Promise to fetch result for
 * @param obj Object to set result of promise to
 * @param key Property in object to set result to
 * @param label Description of what promise is trying to  do
 */
export function setPromiseResult(promise, obj, key, label) {
  promise
    .then((res) => {
      obj[key] = res;
    })
    .catch((e) => {
      console.warn('Failed to: ', label, e); // eslint-disable-line no-console
    });
}
