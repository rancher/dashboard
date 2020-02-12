<script>
import { PROJECT } from '@/config/types';

export default {
  asyncData(ctx) {
    return ctx.store.dispatch('management/findAll', { type: PROJECT.APPS }).then((apps) => {
      const gatekeeper = apps.find(app => app.metadata.name === 'gatekeeper-operator');

      if (gatekeeper) {
        return { gatekeeper };
      }

      return { gatekeeper: null };
    });
  },
};
</script>

<template>
  <div>
    <header>
      <h1>
        Gatekeeper
      </h1>
    </header>
    <div>
      <span v-if="gatekeeper && gatekeeper.id">
        Gatekeeper is enabled.
      </span>
      <span v-else>
        Gatekeeper is not enabled.
      </span>
    </div>
  </div>
</template>
