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

    async save(buttonDone) {
      this.errors = null;
      try {
        debugger;
        await this.applyHooks(BEFORE_SAVE_HOOKS);
        if ( this.isCreate ) {
          let url = this.schema.linkFor('collection');

          if ( this.namespaceSuffixOnCreate ) {
            url += `/${ this.value.metadata.namespace }`;
          }

          const res = await this.value.save({ url });

          Object.assign(this.value, res);
          await this.value.$dispatch('load', this.value);
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
