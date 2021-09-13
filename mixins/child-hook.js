import { findBy } from '@/utils/array';
import { sortBy } from '@/utils/sort';

let NEXT_ID = 1;

export const BEFORE_SAVE_HOOKS = '_beforeSaveHooks';
export const AFTER_SAVE_HOOKS = '_afterSaveHooks';

export default {
  methods: {
    registerBeforeHook(boundFn, name, priority) {
      this._registerHook(BEFORE_SAVE_HOOKS, boundFn, name, priority);
    },

    registerAfterHook(boundFn, name, priority) {
      this._registerHook(AFTER_SAVE_HOOKS, boundFn, name, priority);
    },

    async applyHooks(key, ...args) {
      if ( !key ) {
        throw new Error('Must specify key');
      }

      const hooks = sortBy(this[key] || [], ['priority', 'name']);
      const out = {};

      for ( const x of hooks ) {
        console.debug('Applying hook', x.name); // eslint-disable-line no-console
        out[x.name] = await x.fn.apply(this, args);
      }

      return out;
    },

    _registerHook(key, fn, name, priority) {
      if ( !key ) {
        throw new Error('Must specify key');
      }

      if ( !name ) {
        name = `hook_${ NEXT_ID }`;
        NEXT_ID++;
      }

      if ( !priority ) {
        priority = 99;
      }

      let hooks = this[key];

      if ( !hooks ) {
        hooks = [];
        this[key] = hooks;
      }

      let entry = findBy(hooks, 'name', name);

      if ( entry ) {
        entry.priority = priority;
        entry.fn = fn;
      } else {
        entry = {
          name,
          priority,
          fn
        };

        hooks.push(entry);
      }
    },
  },
};
