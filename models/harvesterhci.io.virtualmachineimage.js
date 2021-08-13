import { HCI } from '@/config/types';
import {
  DESCRIPTION,
  ANNOTATIONS_TO_IGNORE_REGEX,
  HCI as HCI_ANNOTATIONS
} from '@/config/labels-annotations';
import { get } from '@/utils/object';
import { findBy } from '@/utils/array';
import { formatSi } from '@/utils/units';

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

      const image = `${ this.metadata.namespace }/${ this.spec.displayName }`;

      router.push({
        name:   `c-cluster-product-resource-create`,
        params: { resource: HCI.VM },
        query:  { image }
      });
    };
  },

  nameDisplay() {
    return this.spec?.displayName;
  },

  isReady() {
    const conditions = get(this, 'status.conditions');

    return (findBy(conditions, 'type', 'Initialized') || {})?.status === 'True';
  },

  stateDisplay() {
    const conditions = get(this, 'status.conditions');
    const Initialized = (findBy(conditions, 'type', 'Initialized') || {});

    return this.isReady ? 'Active' : Initialized?.message ? 'Failed' : 'In-progress';
  },

  imageSource() {
    return get(this.value, `metadata.annotations."${ HCI_ANNOTATIONS.IMAGE_SOURCE }"`) || 'url'; // url is default source
  },

  annotationsToIgnoreRegexes() {
    return [DESCRIPTION].concat(ANNOTATIONS_TO_IGNORE_REGEX);
  },

  downSize() {
    return formatSi(this.status?.size, {
      increment:    1024,
      maxPrecision: 2,
      suffix:       'B',
      firstSuffix:  'B',
    });
  },

  customValidationRules() {
    const out = [];

    if (this.imageSource === 'url') {
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

    if (this.imageSource === 'file') {
      // File is required!
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
};
