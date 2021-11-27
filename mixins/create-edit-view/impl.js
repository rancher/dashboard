import { _CREATE, _EDIT, _VIEW } from '@/config/query-params';
import { LAST_NAMESPACE } from '@/store/prefs';
import { exceptionToErrorsArray } from '@/utils/error';
import ChildHook, { BEFORE_SAVE_HOOKS, AFTER_SAVE_HOOKS } from '@/mixins/child-hook';
import { clear } from '@/utils/array';
import { DEFAULT_WORKSPACE } from '@/models/provisioning.cattle.io.cluster';
import { applyChangeset, changeset, changesetConflicts } from '@/utils/object';
import { cleanForDiff } from '@/plugins/steve/normalize';

export default {
  mixins: [ChildHook],

  mounted() {
    // For easy access debugging...
    if ( typeof window !== 'undefined' ) {
      window.v = this.value;
      window.c = this;
    }
  },

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

      if ( name.endsWith('-id') ) {
        name = name.replace(/(-namespace)?-id$/, '');
      } else if ( name.endsWith('-create') ) {
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
    conflict() {
      const orig = cleanForDiff(this.initialValue.toJSON());
      const user = cleanForDiff(this.value.toJSON());
      const cur = cleanForDiff(this.liveValue.toJSON());

      const bgChange = changeset(orig, cur);
      const userChange = changeset(orig, user);
      const actualConflicts = changesetConflicts(bgChange, userChange);

      console.log('Background Change', bgChange); // eslint-disable-line no-console
      console.log('User Change', userChange); // eslint-disable-line no-console
      console.log('Conflicts', actualConflicts); // eslint-disable-line no-console

      this.value.metadata.resourceVersion = this.liveValue.metadata.resourceVersion;
      applyChangeset(this.value, bgChange);

      if ( actualConflicts.length ) {
        // Stop the save and let the user inspect and continue editing
        const out = [this.$store.getters['i18n/t']('validation.conflict', { fields: actualConflicts.join(', '), fieldCount: actualConflicts.length })];

        return out;
      } else {
        // The save can continue
        return false;
      }
    },

    async save(buttonDone, url, depth = 0) {
      if ( this.errors ) {
        clear(this.errors);
      }

      try {
        await this.applyHooks(BEFORE_SAVE_HOOKS);

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

        await this.applyHooks(AFTER_SAVE_HOOKS);
        buttonDone && buttonDone(true);

        this.done();
      } catch (err) {
        // Conflict, the resource being edited has changed since starting editing
        if ( err.status === 409 && depth === 0 ) {
          const errors = await this.conflict(err);

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
    }
  },
};
