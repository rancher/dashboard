import { omitBy, pickBy, isArray } from 'lodash';
import { _CREATE, _EDIT, _VIEW } from '@/config/query-params';
import { LAST_NAMESPACE } from '@/store/prefs';
import { LABEL_PREFIX_TO_IGNORE, ANNOTATIONS_TO_IGNORE_CONTAINS, ANNOTATIONS_TO_IGNORE_PREFIX } from '@/config/labels-annotations';
import ChildHook, { BEFORE_SAVE_HOOKS, AFTER_SAVE_HOOKS } from './child-hook';

// return true if the string starts with one of the values in prefixes array
const matchesSomePrefix = (string, prefixes) => {
  for (const prefix of prefixes) {
    const regex = new RegExp(`^${ prefix }`);

    if (string.match(regex)) {
      return true;
    }
  }

  return false;
};

// return true if string includes at least one of the strings in matchStrings array
const containsSomeString = (string, matchStrings) => {
  for (const matchString of matchStrings) {
    if (string.includes(matchString)) {
      return true;
    }
  }

  return false;
};

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
        const all = this.value?.metadata?.labels || {};

        return omitBy(all, (value, key) => {
          return matchesSomePrefix(key, this.labelPrefixToIgnore);
        });
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
        const all = this.value?.metadata?.annotations || {};

        return omitBy(all, (value, key) => {
          return (matchesSomePrefix(key, this.annotationsToIgnorePrefix) || containsSomeString(key, this.annotationsToIgnoreContains));
        });
      },
      set(neu) {
        const all = this.value?.metadata?.annotations || {};

        const wasIgnored = pickBy(all, (value, key) => {
          return (matchesSomePrefix(key, this.annotationsToIgnorePrefix) || containsSomeString(key, this.annotationsToIgnoreContains));
        });

        this.$set(this.value.metadata, 'annotations', { ...neu, ...wasIgnored });
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

        // Remove the labels map if it's empty
        if ( this.value?.metadata?.labels && Object.keys(this.value.metadata.labels || {}).length === 0 ) {
          delete this.value.metadata.labels;
        }

        // Remove the annotations map if it's empty
        if ( this.value?.metadata?.annotations && Object.keys(this.value.metadata.annotations || {}).length === 0 ) {
          delete this.value.metadata.annotations;
        }

        if ( this.isCreate ) {
          url = url || this.schema.linkFor('collection');

          if ( this.value?.metadata?.namespace ) {
            this.value.$dispatch('prefs/set', { key: LAST_NAMESPACE, value: this.value.metadata.namespace }, { root: true });
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
        } else if (err.status && err.message) {
          this.errors = [err.message];
        } else if (isArray(err)) {
          this.errors = err;
        } else {
          this.errors = [err];
        }

        buttonDone(false);
      }
    },
  },
};
