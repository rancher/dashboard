import ChildHook, { BEFORE_SAVE_HOOKS, AFTER_SAVE_HOOKS } from './child-hook';
import { _CREATE, _EDIT, _VIEW } from '@/config/query-params';

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

    namespaceSuffixOnCreate: {
      type:    Boolean,
      default: false,
    },
  },

  data() {
    if ( typeof window !== 'undefined' ) {
      window.v = this.value;
    }

    return { errors: null };
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
      if (this.type) {
        return this.$store.getters['cluster/schemaFor'](this.type);
      }

      return this.$store.getters['cluster/schemaFor'](this.value.type);
    },
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
        if ( this.isCreate ) {
          url = url || this.schema.linkFor('collection');

          if ( this.namespaceSuffixOnCreate ) {
            url += `/${ this.value.metadata.namespace }`;
          }

          // @TODO Better place for this...
          if ( this.value?.metadata?.namespace ) {
            this.value.$commit('setDefaultNamespace', this.value?.metadata?.namespace, { root: true });
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
