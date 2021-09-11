import { MODE, _EDIT } from '@/config/query-params';
import { Resource } from '@/plugins/steve/resource-class';

export default class App extends Resource {
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
}
