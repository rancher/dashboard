import { findBy, insertAt } from '@shell/utils/array';
import { ucFirst } from '@shell/utils/string';

import SteveModel from '@shell/plugins/steve/steve-class';

export default class UIPlugin extends SteveModel {

  get name() {
    return this.spec?.plugin?.name;
  }

  get description() {
    return this.spec?.plugin?.description;
  }

  get version() {
    return this.spec?.plugin?.version;
  }
}
