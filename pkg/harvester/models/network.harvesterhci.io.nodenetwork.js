import { findBy } from '@shell/utils/array';
import { get } from '@shell/utils/object';
import { HCI } from '@shell/config/types';
import SteveModel from '@shell/plugins/steve/steve-class';
import HarvesterResource from '~/pkg/harvester/models/harvester';

export default class HciNodeNetwork extends HarvesterResource {
  get message() {
    const conditions = get(this, 'status.conditions');

    return (findBy(conditions, 'type', 'Ready') || {}).message ;
  }

  get isReady() {
    const conditions = get(this, 'status.conditions');

    return (findBy(conditions, 'type', 'Ready') || {})?.status === 'True';
  }

  get nics() {
    return this?.status?.nics || [];
  }

  get attachNodeName() {
    return get(this, `metadata.labels."network.harvesterhci.io/nodename"`) || '';
  }

  get linkMessage() {
    return {
      name:    this.attachNodeName,
      message: this.message,
      to:      `${ HCI.HOST }/${ this.attachNodeName }?mode=edit`
    };
  }
}
