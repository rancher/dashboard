import isEmpty from 'lodash/isEmpty';
import { ucFirst } from '@shell/utils/string';
import SteveModel from '@shell/plugins/steve/steve-class';

export default class K8sEvent extends SteveModel {
  get displayInvolvedObject() {
    const involvedObject = this.involvedObject;

    if (isEmpty(involvedObject)) {
      return 'N/A';
    }

    return `${ involvedObject.kind } ${ involvedObject.name }`;
  }

  get displayMessage() {
    return ucFirst(this.message);
  }

  get timestamp() {
    return this.lastTimestamp || this.metadata?.creationTimestamp;
  }
}
