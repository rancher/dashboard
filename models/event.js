import isEmpty from 'lodash/isEmpty';
import { ucFirst } from '@/utils/string';

export default {
  displayInvolvedObject() {
    const involvedObject = this.involvedObject;

    if (isEmpty(involvedObject)) {
      return 'N/A';
    }

    return `${ involvedObject.kind } ${ involvedObject.name }`;
  },

  displayMessage() {
    return ucFirst(this.message);
  }
};
