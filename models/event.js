import isEmpty from 'lodash/isEmpty';

export default {
  displayInvolvedObject() {
    const involvedObject = this.involvedObject;

    if (isEmpty(involvedObject)) {
      return 'N/A';
    }

    return `${ involvedObject.kind } - ${ involvedObject.name }`;
  },
};
