import Vue from 'vue';
import { hasFetch, normalizeError, addLifecycleHook } from '../utils/nuxt';

export default {
  beforeCreate() {
    if (!hasFetch(this)) {
      return;
    }

    this._fetchDelay = typeof this.$options.fetchDelay === 'number' ? this.$options.fetchDelay : 200;

    Vue.util.defineReactive(this, '$fetchState', {
      pending:   false,
      error:     null,
      timestamp: Date.now()
    });

    this.$fetch = $fetch.bind(this);
    addLifecycleHook(this, 'beforeMount', beforeMount);
  }
};

function beforeMount() {
  if (!this._hydrated) {
    return this.$fetch();
  }
}

function $fetch() {
  if (!this._fetchPromise) {
    this._fetchPromise = $_fetch.call(this)
      .then(() => {
        delete this._fetchPromise;
      });
  }

  return this._fetchPromise;
}

async function $_fetch() { // eslint-disable-line camelcase
  this.$fetchState.pending = true;
  this.$fetchState.error = null;
  this._hydrated = false;
  let error = null;
  const startTime = Date.now();

  try {
    await this.$options.fetch.call(this);
  } catch (err) {
    // In most cases we don't handle errors at all in `fetch`es. Lets always log to help in production
    console.error('Error in fetch():', err); // eslint-disable-line no-console

    error = normalizeError(err);
  }

  const delayLeft = this._fetchDelay - (Date.now() - startTime);

  if (delayLeft > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayLeft));
  }

  this.$fetchState.error = error;
  this.$fetchState.pending = false;
  this.$fetchState.timestamp = Date.now();
}
