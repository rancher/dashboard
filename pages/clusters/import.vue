<script>
import { allHash } from '@/utils/promise';
import { CLOUD } from '@/utils/types';
import LabeledInput from '@/components/form/LabeledInput';

const RESOURCE = CLOUD.REGISTRATION_TOKEN;

export default {
  components: { LabeledInput },

  data() {
    return {
      step:    1,
      name:    '',
      baseUrl: 'https://api.rio.rancher.cloud',
    };
  },

  watch: {
    name(neu, old) {
      if ( old && !neu ) {
        this.step = 1;
      }
    }
  },

  async asyncData(ctx) {
    const hash = await allHash({ tokens: ctx.store.dispatch('cluster/findAll', { type: RESOURCE }) });

    const token = hash.tokens[0].spec.token;

    return { token };
  },

  methods: {
    goToStepTwo() {
      this.step = 2;
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
      <h3 class="mb-40">
        Step 1: Give it a name
      </h3>
      <LabeledInput
        v-model="name"
        label="New Cluster Name"
        placeholder="e.g. my-prod-cluster"
        :required="true"
      />

      <div v-if="step === 2" class="mt-40">
        <h3>Step 2: Run this command to import your cluster</h3>
        <pre
          class="p-20 m-20"
          style="background-color: #333"
        ><code v-trim-whitespace>kubectl apply -f {{ baseUrl }}/import/{{ token }}?name={{ name }}</code></pre>

        <button
          class="btn bg-primary ml-20"
        >
          <i class="icon icon-copy" /> Copy to Clipboard
        </button>

        <h3 class="mt-40">
          Step 3: There is no step 3
        </h3>
        </pre>
      </div>
      <div v-else>
        <button type="button" class="btn btn-lg bg-primary" @click="goToStepTwo">
          Next
        </button>
      </div>
    </form>
  </div>
</template>
