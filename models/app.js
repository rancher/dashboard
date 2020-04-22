import { addParams } from '@/utils/url';
import { MODE, _EDIT } from '@/config/query-params';

export default {
  appEditUrl() {
    return this.detailUrl();
  },

  goToEdit() {
    return (moreQuery = {}) => {
      const url = addParams(this.appEditUrl, { [MODE]: _EDIT, ...moreQuery });

      this.currentRouter().push({ path: url });
    };
  },
};
