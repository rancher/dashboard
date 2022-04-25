import SteveModel from '@/plugins/steve/steve-class';
import { set } from '@/utils/object';

export default class AlertmanagerConfig extends SteveModel {
  applyDefaults() {
    if (this.spec) {
      return this.spec;
    }
    const existingReceivers = this.spec?.route?.receivers || [];
    const existingReceiverNames = existingReceivers.map((receiver) => {
      return receiver.name;
    });

    const defaultSpec = {
      receivers: [...existingReceivers],
      route:     {
        receivers:      existingReceiverNames,
        groupBy:        this.spec?.route?.groupBy || [],
        groupWait:      this.spec?.route?.groupWait || '30s',
        groupInterval:  this.spec?.route?.groupInterval || '5m',
        repeatInterval: this.spec?.route?.repeatInterval || '4h',
        match:          this.spec?.route?.match || {},
        matchRe:        this.spec?.route?.matchRe || {}
      }
    };

    set(this, 'spec', defaultSpec);
  }
}
