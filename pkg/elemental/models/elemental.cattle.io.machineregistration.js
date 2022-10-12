import Vue from 'vue';
import ElementalResource from './elemental-resource';
import { _CREATE } from '@shell/config/query-params';
import { ELEMENTAL_DEFAULT_NAMESPACE } from '../types';
import { ANNOTATIONS_TO_IGNORE_REGEX, LABELS_TO_IGNORE_REGEX } from '@shell/config/labels-annotations';
import pickBy from 'lodash/pickBy';
import omitBy from 'lodash/omitBy';
import { matchesSomeRegex } from '@shell/utils/string';

const DEFAULT_CREATION_YAML = `cloud-config:
  users:
    name: root
    passwd: root
elemental:
  install:
    poweroff: true
    device: /dev/nvme0n1`;

export default class MachineRegistration extends ElementalResource {
  applyDefaults(vm, mode) {
    if ( !this.spec ) {
      Vue.set(this, 'spec', { config: DEFAULT_CREATION_YAML });
    }
    if ( !this.metadata || mode === _CREATE ) {
      Vue.set(this, 'metadata', { namespace: ELEMENTAL_DEFAULT_NAMESPACE });
    }
  }

  setLabels(val, prop = 'labels', isSpec = false) {
    if (isSpec && !this.spec) {
      this.spec = {};
    } else if ( !this.metadata ) {
      this.metadata = {};
    }

    let all = this.metadata[prop] || {};

    if (isSpec) {
      all = this.spec[prop] || {};
    }

    const wasIgnored = pickBy(all, (value, key) => {
      return matchesSomeRegex(key, LABELS_TO_IGNORE_REGEX);
    });

    if (isSpec) {
      Vue.set(this.spec, prop, { ...wasIgnored, ...val });
    } else {
      Vue.set(this.metadata, prop, { ...wasIgnored, ...val });
    }
  }

  setAnnotations(val, prop = 'annotations', isSpec = false) {
    if (isSpec && !this.spec) {
      this.spec = {};
    } else if ( !this.metadata ) {
      this.metadata = {};
    }

    let all = this.metadata[prop] || {};

    if (isSpec) {
      all = this.spec[prop] || {};
    }

    const wasIgnored = pickBy(all, (value, key) => {
      return matchesSomeRegex(key, ANNOTATIONS_TO_IGNORE_REGEX);
    });

    if (isSpec) {
      Vue.set(this.spec, prop, { ...wasIgnored, ...val });
    } else {
      Vue.set(this.metadata, prop, { ...wasIgnored, ...val });
    }
  }

  get machineInventoryLabels() {
    const all = this.spec?.machineInventoryLabels || {};

    return omitBy(all, (value, key) => {
      return matchesSomeRegex(key, LABELS_TO_IGNORE_REGEX);
    });
  }

  get machineInventoryAnnotations() {
    const all = this.spec?.machineInventoryAnnotations || {};

    return omitBy(all, (value, key) => {
      return matchesSomeRegex(key, ANNOTATIONS_TO_IGNORE_REGEX);
    });
  }
}
