import { ANNOTATIONS_TO_IGNORE_REGEX, LABELS_TO_IGNORE_REGEX } from '@shell/config/labels-annotations';
import pickBy from 'lodash/pickBy';
import Vue from 'vue';
import { matchesSomeRegex } from '@shell/utils/string';
import Resource from '@shell/plugins/core-store/resource-class';

export default class NormanModel extends Resource {
  setLabels(val) {
    const all = this.labels || {};
    const wasIgnored = pickBy(all, (value, key) => {
      return matchesSomeRegex(key, LABELS_TO_IGNORE_REGEX);
    });

    Vue.set(this, 'labels', { ...wasIgnored, ...val });
  }

  setLabel(key, val) {
    if ( val ) {
      if ( !this.labels ) {
        this.labels = {};
      }

      Vue.set(this.labels, key, val);
    } else if ( this.labels ) {
      Vue.set(this.labels, key, undefined);
      delete this.labels[key];
    }
  }

  setAnnotations(val) {
    const all = this.annotations || {};
    const wasIgnored = pickBy(all, (value, key) => {
      return matchesSomeRegex(key, ANNOTATIONS_TO_IGNORE_REGEX);
    });

    Vue.set(this, 'annotations', { ...wasIgnored, ...val });
  }

  setAnnotation(key, val) {
    if ( val ) {
      if ( !this.annotations ) {
        this.annotations = {};
      }

      Vue.set(this.annotations, key, val);
    } else if ( this.annotations ) {
      Vue.set(this.annotations, key, undefined);
      delete this.annotations[key];
    }
  }
}
