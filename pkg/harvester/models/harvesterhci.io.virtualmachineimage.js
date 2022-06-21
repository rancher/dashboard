import Vue from 'vue';
import { HCI } from '@shell/config/types';
import {
  DESCRIPTION,
  ANNOTATIONS_TO_IGNORE_REGEX,
  HCI as HCI_ANNOTATIONS
} from '@shell/config/labels-annotations';
import { get, clone } from '@shell/utils/object';
import { formatSi } from '@shell/utils/units';
import { ucFirst } from '@shell/utils/string';
import { stateDisplay, colorForState } from '@shell/plugins/dashboard-store/resource-class';
import SteveModel from '@shell/plugins/steve/steve-class';

export function isReady() {
  function getStatusConditionOfType(type, defaultValue = []) {
    const conditions = Array.isArray(get(this, 'status.conditions')) ? this.status.conditions : defaultValue;

    return conditions.find( cond => cond.type === type);
  }

  const initialized = getStatusConditionOfType.call(this, 'Initialized');
  const imported = getStatusConditionOfType.call(this, 'Imported');
  const isCompleted = this.status?.progress === 100;

  if ([initialized?.status, imported?.status].includes('False')) {
    return false;
  } else {
    return isCompleted && true;
  }
}
export default class HciVmImage extends SteveModel {
  get availableActions() {
    let out = super._availableActions;
    const toFilter = ['goToEditYaml'];

    out = out.filter( A => !toFilter.includes(A.action));

    const schema = this.$getters['schemaFor'](HCI.VM);
    let canCreateVM = true;

    if ( schema && !schema?.collectionMethods.find(x => ['post'].includes(x.toLowerCase())) ) {
      canCreateVM = false;
    }

    return [
      {
        action:     'createFromImage',
        enabled:    canCreateVM,
        icon:       'icon icon-fw icon-spinner',
        label:      this.t('harvester.action.createVM'),
        disabled:   !this.isReady,
      },
      ...out
    ];
  }

  applyDefaults(resources = this, realMode) {
    Vue.set(this.metadata, 'labels', { [HCI_ANNOTATIONS.OS_TYPE]: '', [HCI_ANNOTATIONS.IMAGE_SUFFIX]: '' });
  }

  createFromImage() {
    const router = this.currentRouter();

    router.push({
      name:   `c-cluster-product-resource-create`,
      params: { resource: HCI.VM },
      query:  { image: this.id }
    });
  }

  get nameDisplay() {
    return this.spec?.displayName;
  }

  get isOSImage() {
    return this?.metadata?.annotations?.[HCI_ANNOTATIONS.OS_UPGRADE_IMAGE] === 'True';
  }

  get isReady() {
    return isReady.call(this);
  }

  get stateDisplay() {
    const initialized = this.getStatusConditionOfType('Initialized');
    const imported = this.getStatusConditionOfType('Imported');

    if (imported?.status === 'Unknown') {
      if (this.spec.sourceType === 'download') {
        return 'Downloading';
      } else if (this.spec.sourceType === 'upload') {
        return 'Uploading';
      } else {
        return 'Exporting';
      }
    }

    if (initialized?.message || imported?.message) {
      return 'Failed';
    }

    return stateDisplay(this.metadata.state.name);
  }

  get imageMessage() {
    const conditions = this?.status?.conditions || [];
    const initialized = conditions.find( cond => cond.type === 'Initialized');
    const imported = conditions.find( cond => cond.type === 'Imported');
    const message = initialized?.message || imported?.message;

    return ucFirst(message);
  }

  get stateBackground() {
    return colorForState(this.stateDisplay).replace('text-', 'bg-');
  }

  get imageSource() {
    return get(this, `spec.sourceType`) || 'download';
  }

  get progress() {
    return this?.status?.progress || 0;
  }

  get annotationsToIgnoreRegexes() {
    return [DESCRIPTION].concat(ANNOTATIONS_TO_IGNORE_REGEX);
  }

  get downSize() {
    const size = this.status?.size;

    if (!size) {
      return '-';
    }

    return formatSi(size, {
      increment:    1024,
      maxPrecision: 2,
      suffix:       'B',
      firstSuffix:  'B',
    });
  }

  getStatusConditionOfType(type, defaultValue = []) {
    const conditions = Array.isArray(get(this, 'status.conditions')) ? this.status.conditions : defaultValue;

    return conditions.find( cond => cond.type === type);
  }

  get stateObj() {
    const state = clone(this.metadata?.state);
    const initialized = this.getStatusConditionOfType('Initialized');
    const imported = this.getStatusConditionOfType('Imported');

    if ([initialized?.status, imported?.status].includes('False')) {
      state.error = true;
    }

    return state;
  }

  get stateDescription() {
    return this.imageMessage;
  }

  get displayName() {
    return this.spec?.displayName;
  }

  get uploadImage() {
    return async(file) => {
      const formData = new FormData();

      formData.append('chunk', file);

      try {
        this.$ctx.commit('harvester-common/uploadStart', this.metadata.name, { root: true });

        await this.doAction('upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'File-Size':    file.size,
          },
          params: { size: file.size },
        });
      } catch (err) {
        this.$ctx.commit('harvester-common/uploadEnd', this.metadata.name, { root: true });

        return Promise.reject(err);
      }

      this.$ctx.commit('harvester-common/uploadEnd', this.metadata.name, { root: true });
    };
  }

  get imageSuffix() {
    return this.metadata?.labels?.[HCI_ANNOTATIONS.IMAGE_SUFFIX];
  }

  get imageOSType() {
    return this.metadata?.labels?.[HCI_ANNOTATIONS.OS_TYPE];
  }

  get customValidationRules() {
    const out = [];

    if (this.imageSource === 'download') {
      const urlFormat = {
        nullable:       false,
        path:           'spec.url',
        validators:     ['imageUrl'],
      };

      const urlRequired = {
        nullable:       false,
        path:           'spec.url',
        required:       true,
        translationKey: 'harvester.image.url'
      };

      out.push(urlFormat, urlRequired);
    }

    if (this.imageSource === 'upload') {
      const fileRequired = {
        nullable:       false,
        path:           'metadata.annotations',
        validators:     ['fileRequired'],
      };

      out.push(fileRequired);
    }

    return [
      {
        nullable:       false,
        path:           'spec.displayName',
        required:       true,
        minLength:      1,
        maxLength:      63,
        translationKey: 'generic.name'
      },
      {
        nullable:       false,
        path:           'spec.displayName',
        required:       true,
        translationKey: 'generic.name'
      },
      ...out
    ];
  }
}
