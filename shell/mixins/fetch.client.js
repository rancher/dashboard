import { hasFetch, normalizeError, addLifecycleHook } from '../utils/nuxt';

export default {
  beforeCreate() {
    if (!hasFetch(this)) {
      return;
    }

    this._fetchDelay = typeof this.$options.fetchDelay === 'number' ? this.$options.fetchDelay : 200;

    this.$fetch = $fetch.bind(this);
    addLifecycleHook(this, 'beforeMount', beforeMount);
  },

  data() {
    return {
      state: {
        pending:   false,
        error:     null,
        timestamp: Date.now()
      }
    };
  },

  computed: {
    $fetchState() {
      return this.state;
    }
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
  this.state.pending = true;
  this.state.error = null;
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

  this.state.error = error;
  this.state.pending = false;
  this.state.timestamp = Date.now();
}
