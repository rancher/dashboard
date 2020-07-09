import { MODE, _EDIT } from '@/config/query-params';

export default {
  appEditUrl() {
    return this.detailLocation;
  },

  goToEdit() {
    return (moreQuery = {}) => {
      const location = this.appEditUrl;

      location.query = {
        ...location.query,
        [MODE]: _EDIT,
        ...moreQuery
      };

      this.currentRouter().push(location);
    };
  },
};
