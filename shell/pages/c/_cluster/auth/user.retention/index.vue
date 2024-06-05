<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';

import TabTitle from '@shell/components/TabTitle';
import CruResource from '@shell/components/CruResource.vue';
import { useStore } from '@shell/composables/useStore';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';

import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import { ToggleSwitch } from '@components/Form/ToggleSwitch';

export default defineComponent({
  components: {
    TabTitle,
    Checkbox,
    LabeledInput,
    ToggleSwitch,
    CruResource,
  },
  setup() {
    const store = useStore();
    const disableAfterPeriod = ref(false);
    const deleteAfterPeriod = ref(false);
    const disableInactiveUserAfter = ref(null);
    const deleteInactiveUserAfter = ref(null);
    const userRetentionCron = ref(null);
    const userRetentionDryRun = ref(null);
    const userLastLoginDefault = ref(null);
    const loading = ref(true);

    const fetchSetting = async(id: string) => {
      return await store.dispatch('management/find', { type: MANAGEMENT.SETTING, id });
    };

    onMounted(async() => {
      disableInactiveUserAfter.value = await fetchSetting(SETTING.DISABLE_INACTIVE_USER_AFTER);
      disableAfterPeriod.value = !!disableInactiveUserAfter?.value?.value;
      deleteInactiveUserAfter.value = await fetchSetting(SETTING.DELETE_INACTIVE_USER_AFTER);
      deleteAfterPeriod.value = !!deleteInactiveUserAfter?.value?.value;
      userRetentionCron.value = await fetchSetting(SETTING.USER_RETENTION_CRON);
      userRetentionDryRun.value = await fetchSetting(SETTING.USER_RETENTION_DRY_RUN);
      userLastLoginDefault.value = await fetchSetting(SETTING.USER_LAST_LOGIN_DEFAULT);
      loading.value = false;
    });

    const save = async(btnCB) => {
      try {
        await disableInactiveUserAfter?.value?.save();
        await deleteInactiveUserAfter?.value?.save();
        await userRetentionCron?.value?.save();
        await userRetentionDryRun?.value?.save();
        await userLastLoginDefault?.value?.save();
        btnCB(true);
      } catch (err) {
        console.log(err);
        btnCB(false);
      }
    };

    return {
      disableAfterPeriod,
      deleteAfterPeriod,
      disableInactiveUserAfter,
      deleteInactiveUserAfter,
      userRetentionCron,
      userRetentionDryRun,
      userLastLoginDefault,
      save,
      loading,
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
    <cru-resource
      mode="EDIT"
      :resource="{ }"
      :can-yaml="false"
      @finish="save"
    >
      <div
        v-if="!loading"
        class="form-user-retention"
      >
        <div class="input-fieldset">
          <checkbox
            v-model="disableAfterPeriod"
            label="Disable user accounts after an inactivity  period (days since last login)"
          />
          <labeled-input
            v-model="disableInactiveUserAfter.value"
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
            v-model="deleteInactiveUserAfter.value"
            label="Inactivity period (days)"
            :disabled="!deleteAfterPeriod"
          />
        </div>
        <template
          v-if="disableAfterPeriod || deleteAfterPeriod"
        >
          <div class="input-fieldset">
            <labeled-input
              v-model="userRetentionCron.value"
              required
              type="cron"
              label="User retention process schedule"
              sub-label="The user retention process runs as a cron job (required)"
            />
          </div>
          <div class="input-fieldset condensed">
            <toggle-switch
              v-model="userRetentionDryRun.value"
              :onValue="'true'"
              :offValue="'false'"
              on-label="Run the user retention process in DRY mode (no changes will be applied)"
            />
            <span class="input-detail">You can check the logs to see which accounts would be affected</span>
          </div>
          <div class="input-fieldset condensed">
            <labeled-input
              v-model="userLastLoginDefault.value"
              label="Default last login (ms)"
              sub-label="Accounts without a registered last login timestamp will get this as a default"
              placeholder="Unix timestamp"
            />
          </div>
        </template>
      </div>
    </cru-resource>
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
