<script>
import parseUrl from 'url-parse';
import { findBy } from '@/utils/array';
import { allHash } from '@/utils/promise';
import { RANCHER, CLOUD } from '@/config/types';
import LabeledInput from '@/components/form/LabeledInput';
import AsyncButton from '@/components/AsyncButton';
import CopyToClipboard from '@/components/CopyToClipboard';

export default {
  components: {
    AsyncButton, CopyToClipboard, LabeledInput
  },

  data() {
    return {
      step:    1,
      baseUrl: 'https://api.rio.rancher.cloud',
    };
  },

  computed: {
    command() {
      const token = this.token;
      const secret = token.spec.token;
      const baseUrl = parseUrl(token.links.self).origin;
      const name = this.cluster.metadata.name;

      const out = `kubectl apply -f ${ baseUrl }/import/${ secret }?name=${ escape(name) }`;

      return out;
    }
  },

  async asyncData({ store }) {
    const users = await store.dispatch('rancher/findAll', {
      type: RANCHER.USER,
      opt:  { url: '/v3/users' }
    });

    const me = findBy(users, 'me', true);

    const hash = await allHash({
      tokens:  store.dispatch('cluster/findAll', { type: CLOUD.REGISTRATION_TOKEN }),
      cluster: store.dispatch('cluster/create', {
        kind:       'Cluster',
        apiVersion: 'cloud.rio.rancher.io/v1',
        type:       CLOUD.CLUSTER,
        metadata:   {
          name:      '',
          namespace: me.id,
        }
      })
    });

    debugger;

    const token = hash.tokens[0];

    return {
      token,
      cluster: hash.cluster,
    };
  },

  methods: {
    async goToStepTwo(buttonCb) {
      await this.cluster.save({ url: `/v1/cloud.rio.rancher.io.v1.clusters/${ this.cluster.metadata.namespace }` });
      this.step = 2;
      buttonCb(true);
    }
  }
};
</script>

<template>
  <div>
    <header>
      <h1>Import Cluster</h1>
    </header>

    <form>
      <div v-if="step === 1">
        <h3>
          Step 1: Give it a name
        </h3>
        <LabeledInput
          v-if="step === 1"
          v-model="cluster.metadata.name"
          label="New Cluster Name"
          placeholder="e.g. my-prod-cluster"
          :required="true"
        />
      </div>

      <div v-if="step === 2">
        <h3>Step 2: Run this command to import your cluster</h3>
        <pre
          class="p-20"
          style="background-color: #333"
        ><code v-trim-whitespace>{{ command }}</code></pre>

        <CopyToClipboard :text="command" />
      </div>
      <div v-else>
        <AsyncButton mode="edit" action-label="Next" @click="goToStepTwo" />
      </div>
    </form>
  </div>
</template>
