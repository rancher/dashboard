import ChildHook, { BEFORE_SAVE_HOOKS, AFTER_SAVE_HOOKS } from './child-hook';
import { _CREATE, _EDIT, _VIEW } from '@/config/query-params';
import { DESCRIPTION } from '@/config/labels-annotations';

export default {
  mixins: [ChildHook],

  props: {
    isDemo: {
      type:    Boolean,
      default: false
    },
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },

    originalValue: {
      type:     Object,
      default: null,
    },

    doneRoute: {
      type:    String,
      default: null
    },
    doneParams: {
      type:    Object,
      default: null,
    },
  },

  data() {
    const v = this.value;

    // For easy access debugging...
    if ( typeof window !== 'undefined' ) {
      window.v = v;
    }

    // Ensure labels & annotations exists, since lots of things need them
    if ( !v.metadata ) {
      v.metadata = {};
    }

    // track description separately from the rest of annotations because it appears separately in UI
    let description;

    if ((v.metadata.annotations || {})[DESCRIPTION]) {
      description = v.metadata.annotations[DESCRIPTION];
      if (this.mode !== 'view') {
        // remove description from annotations so it is not displayed/tracked in annotation component as well as NameNsDescription
        delete v.metadata.annotations[DESCRIPTION];
      }
    }

    return { errors: null, description };
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
      return this.$store.getters['cluster/schemaFor'](this.value.type);
    },

    labels: {
      get() {
        return this.value?.metadata?.labels || {};
      },
      set(neu) {
        // only set a 'label' key in metadata if we have labels to add: shouldn't get to save() with an empty labels prop this way
        if (Object.keys(neu).length) {
          this.$set(this.value.metadata, 'labels', neu);
        }
      }
    },

    annotations: {
      get() {
        return this.value?.metadata?.annotations || {};
      },
      set(neu) {
        if (Object.keys(neu).length) {
          this.$set(this.value.metadata, 'annotations', neu);
        }
      }
    }

  },

  methods: {
    change(value) {
      this.$emit('input', value);
    },

    done() {
      if ( !this.doneRoute ) {
        return;
      }

      this.$router.replace({
        name:   this.doneRoute,
        params: this.doneParams || { resource: this.value.type }
      });
    },

    async save(buttonDone, url) {
      this.errors = null;
      try {
        await this.applyHooks(BEFORE_SAVE_HOOKS);
        // add description to annotations
        if (!this.value.metadata.annotations) {
          this.$set(this.value.metadata, 'annotations', {});
        }
        this.$set(this.value.metadata.annotations, DESCRIPTION, this.description);

        if ( this.isCreate ) {
          url = url || this.schema.linkFor('collection');

          // @TODO Better place for this...
          if ( this.value?.metadata?.namespace ) {
            this.value.$commit('setDefaultNamespace', this.value.metadata.namespace, { root: true });
          }

          const res = await this.value.save({ url });

          if (res) {
            Object.assign(this.value, res);
          }
        } else {
          await this.value.save();
        }

        await this.applyHooks(AFTER_SAVE_HOOKS);
        buttonDone(true);
        this.done();
      } catch (err) {
        if ( err && err.response && err.response.data ) {
          const body = err.response.data;

          if ( body && body.message ) {
            this.errors = [body.message];
          } else {
            this.errors = [err];
          }
        } else {
          this.errors = [err];
        }

        buttonDone(false);
      }
    },
  },
};
