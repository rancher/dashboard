<script lang="ts">
import { defineComponent, ref } from 'vue';

import TabTitle from '@shell/components/TabTitle';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import { ToggleSwitch } from '@components/Form/ToggleSwitch';

export default defineComponent({
  components: {
    TabTitle,
    Checkbox,
    LabeledInput,
    ToggleSwitch,
  },
  setup() {
    const disableAfterPeriod = ref(false);
    const deleteAfterPeriod = ref(false);
    const disableAfter = ref(30);
    const deleteAfter = ref(30);
    const userRetentionCron = ref(0);
    const shouldRunDryMode = ref(false);
    const defaultLastLogin = ref(0);

    return {
      disableAfterPeriod,
      deleteAfterPeriod,
      disableAfter,
      deleteAfter,
      userRetentionCron,
      shouldRunDryMode,
      defaultLastLogin,
    };
  },
});
</script>

<template>
  <div>
    <header>
      <div class="title">
        <h1
          data-testid="charts-header-title"
          class="m-0"
        >
          <TabTitle :showChild="false">
            Users: Settings
          </TabTitle>
          <router-link
            :to="{
              name: 'c-cluster-product-resource',
              params: {
                cluster: '_',
                product: 'auth',
                resource: 'management.cattle.io.user',
              }
            }"
          >
            Users:
          </router-link>
          Settings
        </h1>
      </div>
    </header>
    <h2>User retention</h2>
    <div class="form-user-retention">
      <div class="input-fieldset">
        <checkbox
          v-model="disableAfterPeriod"
          label="Disable user accounts after an inactivity  period (days since last login)"
        />
        <labeled-input
          v-model="disableAfter"
          label="Inactivity period (days)"
          :disabled="!disableAfterPeriod"
        />
      </div>
      <div class="input-fieldset">
        <checkbox
          v-model="deleteAfterPeriod"
          label="Delete user accounts after an inactivity  period (days since last login)"
        />
        <labeled-input
          v-model="deleteAfter"
          label="Inactivity period (days)"
          :disabled="!deleteAfterPeriod"
        />
      </div>
      <template
        v-if="disableAfterPeriod || deleteAfterPeriod"
      >
        <div class="input-fieldset">
          <labeled-input
            v-model="userRetentionCron"
            required
            type="cron"
            label="User retention process schedule"
            sub-label="The user retention process runs as a cron job (required)"
          />
        </div>
        <div class="input-fieldset condensed">
          <toggle-switch
            v-model="shouldRunDryMode"
            on-label="Run the user retention process in DRY mode (no changes will be applied)"
          />
          <span class="input-detail">You can check the logs to see which accounts would be affected</span>
        </div>
        <div class="input-fieldset condensed">
          <labeled-input
            v-model="defaultLastLogin"
            label="Default last login (ms)"
            sub-label="Accounts without a registered last login timestamp will get this as a default"
            placeholder="Unix timestamp"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .form-user-retention {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .input-fieldset {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;

    &.condensed {
      gap: 0.25rem;
    }
  }

  .input-detail {
    color: var(--input-label);
    padding-left: 61px;
  }
</style>
