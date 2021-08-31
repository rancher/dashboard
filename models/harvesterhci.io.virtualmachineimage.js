import { HCI } from '@/config/types';
import {
  DESCRIPTION,
  ANNOTATIONS_TO_IGNORE_REGEX,
} from '@/config/labels-annotations';
import { get, clone } from '@/utils/object';
import { formatSi } from '@/utils/units';
import { ucFirst } from '@/utils/string';
import { stateDisplay } from '@/plugins/steve/resource-instance';

export default {
  availableActions() {
    let out = this._standardActions;
    const toFilter = ['goToEditYaml'];

    out = out.filter( A => !toFilter.includes(A.action));

    return [
      {
        action:     'createFromImage',
        enabled:    this.isReady,
        icon:       'icon icon-fw icon-spinner',
        label:      this.t('harvester.action.createVM'),
      },
      ...out
    ];
  },

  createFromImage() {
    return () => {
      const router = this.currentRouter();

      router.push({
        name:   `c-cluster-product-resource-create`,
        params: { resource: HCI.VM },
        query:  { image: this.id }
      });
    };
  },

  nameDisplay() {
    return this.spec?.displayName;
  },

  isReady() {
    const initialized = this.getStatusConditionOfType('Initialized');
    const uploaded = this.getStatusConditionOfType('Uploaded');

    if ([initialized?.status, uploaded?.status].includes('False')) {
      return false;
    } else {
      return true;
    }
  },

  stateDisplay() {
    const initialized = this.getStatusConditionOfType('Initialized');
    const uploaded = this.getStatusConditionOfType('Uploaded');

    if (uploaded?.status === 'Unknown') {
      return 'Uploading';
    }

    if (initialized?.message || uploaded?.message) {
      return 'Failed';
    }

    return stateDisplay(this.metadata.state.name);
  },

  imageSource() {
    return get(this, `spec.sourceType`) || 'download';
  },

  annotationsToIgnoreRegexes() {
    return [DESCRIPTION].concat(ANNOTATIONS_TO_IGNORE_REGEX);
  },

  downSize() {
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
  },

  customValidationRules() {
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
  },

  getStatusConditionOfType() {
    return (type, defaultValue = []) => {
      const conditions = Array.isArray(get(this, 'status.conditions')) ? this.status.conditions : defaultValue;

      return conditions.find( cond => cond.type === type);
    };
  },

  stateObj() {
    const state = clone(this.metadata?.state);
    const initialized = this.getStatusConditionOfType('Initialized');
    const uploaded = this.getStatusConditionOfType('Uploaded');

    if ([initialized?.status, uploaded?.status].includes('False')) {
      state.error = true;
    }

    return state;
  },

  stateDescription() {
    const uploaded = this.getStatusConditionOfType('Uploaded');

    const status = uploaded?.status;
    const message = uploaded?.message;

    return status === 'False' ? ucFirst(message) : '';
  },
};
