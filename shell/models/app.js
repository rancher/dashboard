import { MODE, _EDIT } from '@shell/config/query-params';
import NormanModel from '@shell/plugins/steve/norman-class';
import { parseHelmExternalId } from '@shell/utils/parse-externalid';

export default class App extends NormanModel {
  get appEditUrl() {
    return this.detailLocation;
  }

  goToEdit(moreQuery = {}) {
    const location = this.appEditUrl;

    location.query = {
      ...location.query,
      [MODE]: _EDIT,
      ...moreQuery
    };

    this.currentRouter().push(location);
  }

  get currentVersion() {
    return parseHelmExternalId(this.externalId).version;
  }
}
