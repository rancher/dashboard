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

  get eventType() {
    return this._type;
  }

  get firstSeen() {
    const schema = this.$getters['schemaFor'](this.type);
    const rowValueGetter = this.$rootGetters['type-map/rowValueGetter'];

    return schema && rowValueGetter ? rowValueGetter(schema, 'First Seen')(this) : null;
  }

  get lastSeen() {
    const schema = this.$getters['schemaFor'](this.type);
    const rowValueGetter = this.$rootGetters['type-map/rowValueGetter'];

    return schema && rowValueGetter ? rowValueGetter(schema, 'Last Seen')(this) : null;
  }

  // Because we're using eventType which is a non-standard state we don't have a reliable way to provide a state color anymore and have therefore disabled the color.
  get insightsColor() {
    return 'disabled';
  }
}
