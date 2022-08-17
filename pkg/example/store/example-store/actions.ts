import { SCHEMA } from '@shell/config/types';
import { normalizeType } from '@shell/plugins/dashboard-store/normalize';
import { exampleStoreMockRequest, exampleStoreSchemas } from '../mock-data';

export default {

  remove({ commit }: any, obj: any ) {
    commit('remove', obj);
  },

  request(ctx: any, {
    opt, type, clusterId, growlOnError = false
  }: any) {
    // This is where custom api requests via $axios should be made
    const res = exampleStoreMockRequest(ctx, opt);

    return responseObject(res);

    function responseObject(res: any) {
      let out = res.data;

      if (typeof out === 'string') {
        out = {};
      }

      if ( res.status === 204 || out === null || typeof out === 'string') {
        out = {};
      }

      Object.defineProperties(out, {
        _status:     { value: res.status },
        _statusText: { value: res.statusText },
        _headers:    { value: res.headers },
        _req:        { value: res.request },
        _url:        { value: opt.url },
      });

      return out;
    }
  },

  async onLogout({ commit, dispatch }: any) {
    await dispatch(`unsubscribe`);
    await commit('reset');
  },

  loadSchemas: ( ctx: any ) => {
    const { commit } = ctx;

    const res = { data: exampleStoreSchemas() };

    res.data.forEach((schema: any) => {
      schema._id = normalizeType(schema.id);
      schema._group = normalizeType(schema.attributes?.group);
    });

    commit('loadAll', {
      ctx,
      type: SCHEMA,
      data: res.data
    });
  },

  loadCluster: ( ctx: any, { id }: any ) => {
    // If there are any resources to fetch or actions to do when a cluster for this type is visited... this is the place
  },

  watch() {
  },

};
