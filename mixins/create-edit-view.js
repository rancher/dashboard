import ChildHook from './child-hook';
import { _CREATE, _EDIT, _VIEW } from '@/config/query-params';

export default {
  mixins: [ChildHook],

  props: {
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

    typeLabel: {
      type:     String,
      required: true,
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
    return {};
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
      try {
        if ( this.isCreate ) {
          await this.schema.followLink('collection', {
            urlSuffix: ( this.namespaceSuffixOnCreate ? `/${ this.value.metadata.namespace }` : null),
            method:    'POST',
            headers:   {
              'content-type': 'application/json',
              accept:         'application/json',
            },
            data: this.value,
          });
        } else {
          await this.value.followLink('update', {
            method:  'PUT',
            headers: {
              'content-type': 'application/json',
              accept:         'application/json',
            },
            data: this.value,
          });
        }

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
