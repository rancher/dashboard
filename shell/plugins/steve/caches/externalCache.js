import BaseCache from '@shell/plugins/steve/caches/base-cache';

export default class ExternalCache extends BaseCache {
  data = null;
  uiApi = null;
  loadedTimestamp = null;
  source = 'ui';
  constructor(type, getters, rootGetters, api, uiApi) {
    super(type, getters, rootGetters, api, uiApi);
    this.uiApi = uiApi;
  }

  async request({ type }) {
    const uiRequest = await this.uiApi(type)
      .then((res) => {
        return res;
      });
    const { data: { data } } = uiRequest;

    this.load(data);

    return { ...uiRequest, data: { ...uiRequest.data, storeType: type } };
  }

  load(data) {
    this.data = data;
    this.loadedTimestamp = Date.now();
  }
}
