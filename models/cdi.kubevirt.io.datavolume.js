import { colorForState } from '@/plugins/steve/resource-instance';
import { HCI } from '@/config/types';
import {
  DESCRIPTION,
  LABELS_TO_IGNORE_REGEX,
  ANNOTATIONS_TO_IGNORE_REGEX,
  HCI as HCI_ANNOTATIONS
} from '@/config/labels-annotations';
import { findBy } from '@/utils/array';
import { get } from '@/utils/object';

export default {
  stateDisplay() {
    const ownedBy = this?.metadata?.annotations?.[HCI_ANNOTATIONS.OWNED_BY];
    const conditions = get(this, 'status.conditions');
    const readyCondition = findBy(conditions, 'type', 'Ready');
    const status = readyCondition?.status === 'True' ? 'Ready' : 'NotReady';

    if (ownedBy) {
      return 'In-use';
    } else {
      return status;
    }
  },

  stateBackground() {
    if (this.stateDisplay === 'Ready') {
      return 'bg-primary';
    }

    return colorForState(this.stateDisplay).replace('text-', 'bg-');
  },

  phaseStatus() {
    return this?.status?.phase || 'N/A';
  },

  phaseStatusBackgroud() {
    return colorForState(this.phaseStatus).replace('text-', 'bg-');
  },

  attachVM() {
    const vmList = this.$rootGetters['cluster/all'](HCI.VM);
    const ownerAnnotation = get(this, `metadata.annotations."${ HCI_ANNOTATIONS.OWNED_BY }"`) || '';

    if (!ownerAnnotation) {
      return;
    }

    const owner = JSON.parse(ownerAnnotation)[0]?.refs?.[0];

    return vmList.find( (D) => {
      return D.id === owner;
    });
  },

  isRWO() {
    return this.spec?.pvc?.accessModes?.[0] === 'ReadWriteOnce';
  },

  warningCount() {
    return this.resourcesStatus.warningCount;
  },

  errorCount() {
    return this.resourcesStatus.errorCount;
  },

  resourcesStatus() {
    const list = this.$rootGetters['cluster/all'](HCI.DATA_VOLUME);

    let warning = 0;
    let error = 0;

    list.forEach((item) => {
      if (item.phaseStatus === 'N/A') {
        error += 1;
      } else if (item.phaseStatus !== 'Succeeded') {
        warning += 1;
      }
    });

    return {
      warningCount: warning,
      errorCount:   error
    };
  },

  labelsToIgnoreRegexes() {
    return [HCI_ANNOTATIONS.CREATED_BY].concat(LABELS_TO_IGNORE_REGEX);
  },

  annotationsToIgnoreRegexes() {
    return [DESCRIPTION].concat(ANNOTATIONS_TO_IGNORE_REGEX);
  },

  // sort
  volumeSort() {
    const volume = this?.spec?.pvc?.resources?.requests?.storage || 0;

    return parseInt(volume);
  },

  customValidationRules() {
    const out = [
      {
        nullable:       false,
        path:           'metadata.name',
        required:       true,
        minLength:      1,
        maxLength:      63,
        translationKey: 'generic.name'
      },
      {
        nullable:       false,
        path:           'spec.pvc.resources.requests.storage',
        translationKey: 'harvester.volume.size',
        type:           'string',
        validators:     ['dataVolumeSize']
      },
      {
        nullable:       false,
        path:           'spec.source',
        required:       true,
        translationKey: 'harvester.volume.source',
        type:           'object',
      },
    ];

    if (this.metadata?.annotations?.hasOwnProperty('harvesterhci.io/imageId')) {
      out.push({
        nullable:       false,
        path:           'metadata.annotations',
        required:       true,
        translationKey: 'harvester.volume.image',
        type:           'string',
        validators:     ['dataVolumeImage']
      });
    }

    return out;
  },
};
