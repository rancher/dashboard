import SteveModel from '@shell/plugins/steve/steve-class';
import { MANAGEMENT } from '@shell/config/types';

export default class PodSecurityAdmissionTemplate extends SteveModel {
  get listLocation() {
    return {
      name:   MANAGEMENT.PSA,
      params: {
        product:  MANAGEMENT.PSA,
        resource: this.type,
      }
    };
  }

  get doneOverride() {
    return this.listLocation;
  }
}
