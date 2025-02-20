import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';
import { LAST_NAMESPACE } from '@shell/store/prefs';
import { exceptionToErrorsArray } from '@shell/utils/error';
import ChildHook, { BEFORE_SAVE_HOOKS, AFTER_SAVE_HOOKS } from '@shell/mixins/child-hook';
import { clear } from '@shell/utils/array';
import { DEFAULT_WORKSPACE } from '@shell/config/types';
import { handleConflict } from '@shell/plugins/dashboard-store/normalize';

export default {

  name: 'CreateEditView',

  mixins: [ChildHook],

  emits: ['done'],

  data() {
    // Keep label and annotation filters in data so each resource CRUD page can alter individually
    return { errors: [] };
  },

  computed: {
    isCreate() {
      return this.mode === _CREATE;
    },

    isEdit() {
      return this.mode === _EDIT;
    },

    isView() {
      return this.mode === _VIEW;
    },

    schema() {
      const inStore = this.storeOverride || this.$store.getters['currentStore'](this.value.type);

      return this.$store.getters[`${ inStore }/schemaFor`](this.value.type);
    },

    isNamespaced() {
      return this.schema?.attributes?.namespaced || false;
    },

    labels: {
      get() {
        return this.value?.labels;
      },
      set(neu) {
        this.value.setLabels(neu);
      }
    },

    annotations: {
      get() {
        return this.value?.annotations;
      },
      set(neu) {
        this.value.setAnnotations(neu);
      }
    },

    doneRoute() {
      if ( this.value?.doneRoute ) {
        return this.value.doneRoute;
      }

      let name = this.$route.name;

      if ( name?.endsWith('-id') ) {
        name = name.replace(/(-namespace)?-id$/, '');
      } else if ( name?.endsWith('-create') ) {
        name = name.replace(/-create$/, '');
      }

      return name;
    },

    doneParams() {
      if ( this.value?.doneParams ) {
        return this.value.doneParams;
      }

      const out = { ...this.$route.params };

      delete out.namespace;
      delete out.id;

      return out;
    },

  },

  methods: {
    done() {
      if ( this.doneEvent ) {
        this.$emit('done');

        return;
      }

      if ( this.doneLocationOverride) {
        return this.$router.replace(this.doneLocationOverride);
      }

      if ( !this.doneRoute ) {
        return;
      }

      this.$router.replace({
        name:   this.doneRoute,
        params: this.doneParams || { resource: this.value.type }
      });
    },

    // Detect and resolve conflicts from a 409 response.
    // If they are resolved, return a false-y value
    // Else they can't be resolved, return an array of errors to show to the user.
    async conflict() {
      return await handleConflict(this.initialValue.toJSON(), this.value, this.liveValue, this.$store.getters, this.$store, this.storeOverride || this.$store.getters['currentStore'](this.value.type));
    },

    async save(buttonDone, url, depth = 0) {
      if ( this.errors ) {
        clear(this.errors);
      }

      try {
        await this.applyHooks(BEFORE_SAVE_HOOKS, this.value);

        // Remove the labels map if it's empty
        if ( this.value?.metadata?.labels && Object.keys(this.value.metadata.labels || {}).length === 0 ) {
          delete this.value.metadata.labels;
        }

        // Remove the annotations map if it's empty
        if ( this.value?.metadata?.annotations && Object.keys(this.value.metadata.annotations || {}).length === 0 ) {
          delete this.value.metadata.annotations;
        }

        if ( this.isCreate ) {
          const ns = this.value?.metadata?.namespace;

          // Don't remember fleet-default as a target since the user isn't usually picking it explicitly
          if ( ns && ns !== DEFAULT_WORKSPACE ) {
            this.value.$dispatch('prefs/set', { key: LAST_NAMESPACE, value: ns }, { root: true });
          }
        }

        await this.actuallySave(url);

        // If spoofed we need to reload the values as the server can't have watchers for them.
        if (this.$store.getters['type-map/isSpoofed'](this.value.type)) {
          await this.$store.dispatch('cluster/findAll', { type: this.value.type, opt: { force: true } }, { root: true });
        }

        await this.applyHooks(AFTER_SAVE_HOOKS, this.value);
        buttonDone && buttonDone(true);

        this.done();
      } catch (err) {
        // This exception handles errors from the `request` action when it receives a failed http request. The `err` object could be from the action's error handler (raw http response object containing `status`) or thrown later on given the response of the action (a massaged object containing `_status`). TBD why one 409 triggers the error handler and another does not.
        const IS_ERR_409 = err.status === 409 || err._status === 409;

        // Conflict, the resource being edited has changed since starting editing
        if (IS_ERR_409 && depth === 0 && this.isEdit) {
          const errors = await this.conflict();

          if ( errors === false ) {
            // It was automatically figured out, save again
            return this.save(buttonDone, url, depth + 1);
          } else {
            this.errors = errors;
          }
        } else {
          this.errors = exceptionToErrorsArray(err);
        }
        // Provide a stack trace for easier debugging of save errors
        console.error('CreateEditView mixin failed to save: ', err); // eslint-disable-line no-console
        buttonDone && buttonDone(false);
      }
    },

    async actuallySave(url) {
      if ( this.isCreate ) {
        url = url || this.schema.linkFor('collection');
        const res = await this.value.save({ url });

        if (res) {
          Object.assign(this.value, res);
        }
      } else {
        await this.value.save();
      }
    },

    setErrors(errors) {
      this.errors = errors;
    }
  },
};
