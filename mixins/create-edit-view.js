import { ANNOTATIONS_TO_IGNORE_CONTAINS, ANNOTATIONS_TO_IGNORE_PREFIX, LABEL_PREFIX_TO_IGNORE } from '@/config/labels-annotations';
import { _CREATE, _EDIT, _VIEW } from '@/config/query-params';
import { LAST_NAMESPACE } from '@/store/prefs';
import { exceptionToErrorsArray } from '@/utils/error';
import { containsSomeString, matchesSomePrefix } from '@/utils/string';
import pickBy from 'lodash/pickBy';
import ChildHook, { AFTER_SAVE_HOOKS, BEFORE_SAVE_HOOKS } from './child-hook';

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
  },

  data() {
    const v = this.value;

    // For easy access debugging...
    if ( typeof window !== 'undefined' ) {
      window.v = v;
      window.c = this;
    }

    // Ensure labels & annotations exists, since lots of things need them
    if ( !v.metadata ) {
      v.metadata = {};
    }

    if ( !v.metadata.annotations ) {
      v.metadata.annotations = {};
    }

    if ( !v.metadata.labels ) {
      v.metadata.labels = {};
    }

    // keep label and annotation filters in data so each resource CRUD page can alter individiaully
    return {
      errors:                      null,
      labelPrefixToIgnore:         LABEL_PREFIX_TO_IGNORE,
      annotationsToIgnoreContains: ANNOTATIONS_TO_IGNORE_CONTAINS,
      annotationsToIgnorePrefix:   ANNOTATIONS_TO_IGNORE_PREFIX

    };
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
        return this.value?.labels;
      },
      set(neu) {
        const all = this.value?.metadata?.labels || {};

        const wasIgnored = pickBy(all, (value, key) => {
          return matchesSomePrefix(key, this.labelPrefixToIgnore);
        });

        this.$set(this.value.metadata, 'labels', { ...neu, ...wasIgnored });
      }
    },

    annotations: {
      get() {
        return this.value?.annotations;
      },
      set(neu) {
        const all = this.value?.metadata?.annotations || {};

        const wasIgnored = pickBy(all, (value, key) => {
          return (matchesSomePrefix(key, this.annotationsToIgnorePrefix) || containsSomeString(key, this.annotationsToIgnoreContains));
        });

        this.$set(this.value.metadata, 'annotations', { ...neu, ...wasIgnored });
      }
    },

    doneRoute() {
      let name = this.$route.name;

      if ( name.endsWith('-id') ) {
        name = name.replace(/(-namespace)?-id$/, '');
      } else if ( name.endsWith('-create') ) {
        name = name.replace(/-create$/, '');
      }

      return name;
    },

    doneParams() {
      const out = { ...this.$route.params };

      delete out.namespace;
      delete out.id;

      return out;
    },

  },

  methods: {
    nameDisplayFor(type) {
      const schema = this.$store.getters['cluster/schemaFor'](type);

      return this.$store.getters['type-map/labelFor'](schema) || '';
    },

    // TODO better images for workload types?
    // show initials of workload type in blue circles for now
    initialDisplayFor(type) {
      const typeDisplay = this.nameDisplayFor(type);
      const eachWord = typeDisplay.split(' ');

      return eachWord.reduce((total, word) => {
        total += word[0];

        return total;
      }, '');
    },

    clearErrors() {
      this.errors = null;
    },
    done() {
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

    async save(buttonDone, url) {
      this.clearErrors();
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
          if ( this.value?.metadata?.namespace ) {
            this.value.$dispatch('prefs/set', { key: LAST_NAMESPACE, value: this.value.metadata.namespace }, { root: true });
          }
        }

        await this.actuallySave(url);

        await this.applyHooks(AFTER_SAVE_HOOKS);
        buttonDone(true);
        this.done();
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        buttonDone(false);
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
