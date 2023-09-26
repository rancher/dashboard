import { findBy } from '@shell/utils/array';
import { sortBy } from '@shell/utils/sort';

let NEXT_ID = 1;

export const BEFORE_SAVE_HOOKS = '_beforeSaveHooks';
export const AFTER_SAVE_HOOKS = '_afterSaveHooks';

export default {
  methods: {
    registerBeforeHook(boundFn, name, priority = 99, boundFnContext) {
      this._registerHook(BEFORE_SAVE_HOOKS, boundFn, name, priority, boundFnContext);
    },

    unregisterBeforeSaveHook(name) {
      this[BEFORE_SAVE_HOOKS] = this[BEFORE_SAVE_HOOKS].filter((hook) => {
        // BEFORE_SAVE_HOOKS is an array of objects with keys
        // fn, name and priority.
        return hook.name !== name;
      });
    },

    registerAfterHook(boundFn, name, priority = 99, boundFnContext) {
      this._registerHook(AFTER_SAVE_HOOKS, boundFn, name, priority, boundFnContext);
    },

    async applyHooks(key, ...args) {
      if (!key) {
        throw new Error('Must specify key');
      }

      const hooks = sortBy(this[key] || [], ['priority', 'name']);
      const out = {};

      for (const x of hooks) {
        console.debug('Applying hook', x.name); // eslint-disable-line no-console
        out[x.name] = await x.fn.apply(x.fnContext || this, args);
      }

      return out;
    },

    _registerHook(key, fn, name, priority, fnContext) {
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
        entry.fnContext = fnContext;
      } else {
        entry = {
          name,
          priority,
          fn,
          fnContext
        };

        hooks.push(entry);
      }
    },
  },
};
