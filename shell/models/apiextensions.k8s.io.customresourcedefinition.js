import SteveModel from '@shell/plugins/steve/steve-class';
import { COUNT } from '@shell/config/types';

export default class CustomResourceDefinition extends SteveModel {
  get resourceType() {
    return `${ this.spec.group }.${ this.spec.names.singular }`;
  }

  get resourceCount() {
    return this.$getters.all(COUNT)?.[0].counts[this.resourceType]?.summary.count;
  }

  get resourceLink() {
    const to = { ...this.listLocation };

    to.params.resource = this.resourceType;

    return {
      text: `${ this.resourceType }` + `${ this.resourceCount ? ` (${ this.resourceCount })` : '' }`,
      to
    };
  }
}
