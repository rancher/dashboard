import { LOGGING } from '@shell/config/types';
import { HCI } from '../../types';
import { clone } from '@shell/utils/object';
import Flow from '@shell/models/logging.banzaicloud.io.flow';
import { PRODUCT_NAME as HARVESTER_PRODUCT } from '../../config/harvester';
import { FLOW_TYPE } from '../../config/harvester-map';

export default class HarvesterLogFlow extends Flow {
  get allOutputs() {
    return this.$rootGetters['harvester/all'](LOGGING.OUTPUT) || [];
  }

  get allClusterOutputs() {
    return this.$rootGetters['harvester/all'](LOGGING.CLUSTER_OUTPUT) || [];
  }

  get _detailLocation() {
    const schema = this.$getters['schemaFor'](this.type);

    const id = this.id?.replace(/.*\//, '');

    return {
      name:   `${ HARVESTER_PRODUCT }-c-cluster-resource${ schema?.attributes?.namespaced ? '-namespace' : '' }-id`,
      params: {
        product:   HARVESTER_PRODUCT,
        cluster:   this.$rootGetters['clusterId'],
        resource:  this.type,
        id,
        namespace: this.metadata.namespace,
      },
    };
  }

  get detailLocation() {
    const detailLocation = clone(this._detailLocation);

    detailLocation.params.resource = HCI.FLOW;

    return detailLocation;
  }

  get doneOverride() {
    const detailLocation = clone(this._detailLocation);

    delete detailLocation.params.namespace;
    delete detailLocation.params.id;
    detailLocation.params.resource = HCI.FLOW;
    detailLocation.name = `${ HARVESTER_PRODUCT }-c-cluster-resource`;

    return detailLocation;
  }

  get parentNameOverride() {
    return this.$rootGetters['i18n/t'](`typeLabel."${ HCI.FLOW }"`, { count: 1 })?.trim();
  }

  get parentLocationOverride() {
    return this.doneOverride;
  }

  get loggingType() {
    if (this.spec.loggingRef === 'harvester-kube-audit-log-ref') {
      return FLOW_TYPE.AUDIT;
    }

    if ((this.spec.match || []).find(M => !!M?.select?.labels?.['app.kubernetes.io/name'])) {
      return FLOW_TYPE.EVENT;
    }

    return FLOW_TYPE.LOGGING;
  }
}
