import { ANNOTATIONS_TO_IGNORE_REGEX, LABELS_TO_IGNORE_REGEX } from '@shell/config/labels-annotations';
import omitBy from 'lodash/omitBy';
import pickBy from 'lodash/pickBy';
import Vue from 'vue';
import { matchesSomeRegex } from '@shell/utils/string';
import Resource from './resource-class';

// these are defined elsewhere in Steve models and will cause the error  "Cannot set property <whatever> of [object Object] which has only a getter" if defined at top-level
export function cleanHybridResources(data) {
  const potentialNormanHoldovers = ['state', 'name', 'description', 'labels', 'annotations'];

  potentialNormanHoldovers.forEach(key => delete data[key]);

  return data;
}

export default class HybridModel extends Resource {
  constructor(data, ctx, rehydrateNamespace = null, setClone = false) {
    const cleanedData = cleanHybridResources(data);

    super(cleanedData, ctx, rehydrateNamespace, setClone);
  }

  get labels() {
    const all = this.metadata?.labels || {};

    return omitBy(all, (value, key) => {
      return matchesSomeRegex(key, LABELS_TO_IGNORE_REGEX);
    });
  }

  setLabels(val) {
    if ( !this.metadata ) {
      this.metadata = {};
    }

    const all = this.metadata.labels || {};
    const wasIgnored = pickBy(all, (value, key) => {
      return matchesSomeRegex(key, LABELS_TO_IGNORE_REGEX);
    });

    Vue.set(this.metadata, 'labels', { ...wasIgnored, ...val });
  }

  setLabel(key, val) {
    if ( val ) {
      if ( !this.metadata ) {
        this.metadata = {};
      }

      if ( !this.metadata.labels ) {
        this.metadata.labels = {};
      }

      Vue.set(this.metadata.labels, key, val);
    } else if ( this.metadata?.labels ) {
      Vue.set(this.metadata.labels, key, undefined);
      delete this.metadata.labels[key];
    }
  }

  get annotations() {
    const all = this.metadata?.annotations || {};

    return omitBy(all, (value, key) => {
      return matchesSomeRegex(key, ANNOTATIONS_TO_IGNORE_REGEX);
    });
  }

  setAnnotations(val) {
    if ( !this.metadata ) {
      this.metadata = {};
    }

    const all = this.metadata.annotations || {};
    const wasIgnored = pickBy(all, (value, key) => {
      return matchesSomeRegex(key, ANNOTATIONS_TO_IGNORE_REGEX);
    });

    Vue.set(this.metadata, 'annotations', { ...wasIgnored, ...val });
  }

  setAnnotation(key, val) {
    if ( val ) {
      if ( !this.metadata ) {
        this.metadata = {};
      }

      if ( !this.metadata.annotations ) {
        this.metadata.annotations = {};
      }

      Vue.set(this.metadata.annotations, key, val);
    } else if ( this.metadata?.annotations ) {
      Vue.set(this.metadata.annotations, key, undefined);
      delete this.metadata.annotations[key];
    }
  }

  get state() {
    return this.stateObj?.name || 'unknown';
  }
}
