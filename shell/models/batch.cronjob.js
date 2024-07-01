import { insertAt } from '@shell/utils/array';
import { clone } from '@shell/utils/object';
import { WORKLOAD_TYPES, WORKLOAD_TYPE_TO_KIND_MAPPING } from '@shell/config/types';
import Workload from './workload';

export default class CronJob extends Workload {
  get state() {
    if ( this.spec?.suspend ) {
      return 'suspended';
    }

    return super.state;
  }

  get _availableActions() {
    const out = super._availableActions;
    const suspended = this.spec?.suspend || false;

    const jobSchema = this.$getters['schemaFor'](WORKLOAD_TYPES.JOB);
    const canRunNow = !!jobSchema?.collectionMethods.find((x) => ['blocked-post', 'post'].includes(x.toLowerCase()));

    insertAt(out, 0, {
      action:   'runNow',
      label:    this.t('action.runNow'),
      icon:     'icon icon-spinner',
      enabled:  canRunNow,
      bulkable: true,
    });

    insertAt(out, 1, {
      action:   'suspend',
      label:    this.t('action.suspend'),
      icon:     'icon icon-pause',
      enabled:  !suspended && this.canUpdate,
      bulkable: true,
    });

    insertAt(out, 2, {
      action:   'resume',
      label:    this.t('action.resume'),
      icon:     'icon icon-play',
      enabled:  suspended && this.canUpdate,
      bulkable: true,
    });

    return out;
  }

  async runNow() {
    const ownerRef = {
      apiVersion: this.apiVersion,
      controller: true,
      kind:       this.kind,
      name:       this.metadata.name,
      uid:        this.metadata.uid
    };

    // Set type and kind to ensure the correct model is returned (via classify). This object will be persisted to the store
    const job = await this.$dispatch('create', {
      type: WORKLOAD_TYPES.JOB,
      kind: WORKLOAD_TYPE_TO_KIND_MAPPING[WORKLOAD_TYPES.JOB],
      ...clone(this.spec.jobTemplate)
    });

    job.metadata = job.metadata || {};
    job.metadata.namespace = this.metadata.namespace;
    // Can't use `generatedName` and no `name`... as this fails schema validation
    job.metadata.name = `${ this.metadata.name }-${ Date.now() }`;
    job.metadata.ownerReferences = [ownerRef];

    await job.save();

    job.goToDetail();
  }

  suspend() {
    this.spec.suspend = true;
    this.save();
  }

  resume() {
    this.spec.suspend = false;
    this.save();
  }
}
