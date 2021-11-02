import { HCI } from '@/config/types';
import {
  DESCRIPTION,
  ANNOTATIONS_TO_IGNORE_REGEX,
} from '@/config/labels-annotations';
import { get, clone } from '@/utils/object';
import { formatSi } from '@/utils/units';
import { ucFirst } from '@/utils/string';
import { stateDisplay, colorForState } from '@/plugins/steve/resource-class';
import SteveModel from '@/plugins/steve/steve-class';

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
        enabled:    canCreateVM && this.isReady,
        icon:       'icon icon-fw icon-spinner',
        label:      this.t('harvester.action.createVM'),
      },
      ...out
    ];
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

  get isReady() {
    const initialized = this.getStatusConditionOfType('Initialized');
    const imported = this.getStatusConditionOfType('Imported');

    if ([initialized?.status, imported?.status].includes('False')) {
      return false;
    } else {
      return true;
    }
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

  get stateBackground() {
    return colorForState(this.stateDisplay).replace('text-', 'bg-');
  }

  get imageSource() {
    return get(this, `spec.sourceType`) || 'download';
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
    const imported = this.getStatusConditionOfType('Imported');

    const status = imported?.status;
    const message = imported?.message;

    return status === 'False' ? ucFirst(message) : '';
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
        return Promise.reject(err);
      }

      this.$ctx.commit('harvester-common/uploadEnd', this.metadata.name, { root: true });
    };
  }
}
