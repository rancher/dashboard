import VuexORM from '@vuex-orm/core';
import VuexORMAxios from '@vuex-orm/plugin-axios';
import meta from '~/database/meta';
import v3 from '~/database/v3';

VuexORM.use(VuexORMAxios, {
  database: v3,
  http:     {
    url:     '/',
    headers: {
      Accept:         'application/json',
      'Content-Type': 'application/json'
    }
  }
});

export const plugins = [
  VuexORM.install(meta, { namespace: 'meta' }),
];
