<script>
import { defaultAsyncData } from '@/components/ResourceDetail';
import { CATALOG } from '../config/types';
import { _CREATE, _STAGE } from '../config/query-params';

export default {
  name: 'EditRelease',

  async asyncData(ctx) {
    const { store, params } = ctx;
    const { namespace, id } = params;

    if ( !id ) {
      return defaultAsyncData(ctx, 'chartInstallAction');
    }

    const resource = 'chartUpgradeAction';
    const fqid = `${ namespace }/${ id }`;

    const release = await store.dispatch('cluster/find', {
      type: CATALOG.RELEASE,
      id:   fqid,
      opt:  { watch: true }
    });

    const data = { type: resource };

    const model = await store.dispatch('cluster/create', data);

    if ( release && model ) {
    }

    /*******
     * Important: these need to be declared below as props too if you want to use them
     *******/
    const out = {
      resource,
      model,
      originalModel: model,
      mode:          _CREATE,
      realMode:      _STAGE,
      value:         model
    };

    return out;
  },
};
</script>

<template>
  <div>Release</div>
</template>
