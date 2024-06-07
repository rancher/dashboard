<script lang="ts">
import { defineComponent, ref, reactive, onMounted } from 'vue';

import UserRetentionHeader from '@shell/components/user.retention/header';
import Footer from '@shell/components/form/Footer';
import { useStore } from '@shell/composables/useStore';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';

import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import { ToggleSwitch } from '@components/Form/ToggleSwitch';

export default defineComponent({
  components: {
    Checkbox,
    LabeledInput,
    ToggleSwitch,
    UserRetentionHeader,
    Footer,
  },
  setup() {
    const store = useStore();
    const userRetentionSettings = reactive({
      [SETTING.DISABLE_INACTIVE_USER_AFTER]: null,
      [SETTING.DELETE_INACTIVE_USER_AFTER]:  null,
      [SETTING.USER_RETENTION_CRON]:         null,
      [SETTING.USER_RETENTION_DRY_RUN]:      null,
      [SETTING.USER_LAST_LOGIN_DEFAULT]:     null,
    });
    const disableAfterPeriod = ref(false);
    const deleteAfterPeriod = ref(false);
    const loading = ref(true);
    let settings = null;

    const fetchSetting = async(id: string) => {
      return await store.dispatch('management/find', { type: MANAGEMENT.SETTING, id });
    };

    const ids = Object.keys(userRetentionSettings);
    const settingPromises = ids.map((id) => fetchSetting(id));

    onMounted(async() => {
      settings = await Promise
        .all(settingPromises)
        .then((results) => results.reduce((acc, result, index) => {
          return {
            [ids[index]]: result,
            ...acc,
          };
        }, { }));

      ids.forEach((key) => {
        userRetentionSettings[key] = settings[key].value;
      });

      disableAfterPeriod.value = !!userRetentionSettings[SETTING.DISABLE_INACTIVE_USER_AFTER];
      deleteAfterPeriod.value = !!userRetentionSettings[SETTING.DELETE_INACTIVE_USER_AFTER];
      loading.value = false;
    });

    const save = async(btnCB) => {
      try {
        ids.forEach((key) => {
          settings[key].value = userRetentionSettings[key];
        });

        await Promise.all(ids.map((setting) => settings[setting].save()));

        btnCB(true);
      } catch (err) {
        btnCB(false);
      }
    };

    return {
      disableAfterPeriod,
      deleteAfterPeriod,
      save,
      loading,
      userRetentionSettings,
      SETTING,
    };
  },
});
</script>

<template>
  <div>
    <user-retention-header />
    <h2>User retention</h2>
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
          v-model="userRetentionSettings[SETTING.DISABLE_INACTIVE_USER_AFTER]"
          class="input-field"
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
          v-model="userRetentionSettings[SETTING.DELETE_INACTIVE_USER_AFTER]"
          class="input-field"
          label="Inactivity period (days)"
          :disabled="!deleteAfterPeriod"
        />
      </div>
      <template
        v-if="disableAfterPeriod || deleteAfterPeriod"
      >
        <div class="input-fieldset">
          <labeled-input
            v-model="userRetentionSettings[SETTING.USER_RETENTION_CRON]"
            class="input-field"
            required
            type="cron"
            label="User retention process schedule"
            sub-label="The user retention process runs as a cron job (required)"
          />
        </div>
        <div class="input-fieldset condensed pt-12">
          <toggle-switch
            v-model="userRetentionSettings[SETTING.USER_RETENTION_DRY_RUN]"
            :onValue="'true'"
            :offValue="'false'"
            on-label="Run the user retention process in DRY mode (no changes will be applied)"
          />
          <span class="input-detail">You can check the logs to see which accounts would be affected</span>
        </div>
        <div class="input-fieldset condensed">
          <labeled-input
            v-model="userRetentionSettings[SETTING.USER_LAST_LOGIN_DEFAULT]"
            class="input-field"
            label="Default last login (ms)"
            sub-label="Accounts without a registered last login timestamp will get this as a default"
            placeholder="Unix timestamp"
          />
        </div>
      </template>
    </div>
    <Footer
      class="footer-user-retention"
      mode="edit"
      @save="save"
    />
  </div>
</template>

<style lang="scss" scoped>
  .form-user-retention {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 1.5rem;
  }

  .footer-user-retention {
    border-top: var(--header-border-size) solid var(--header-border);
    right: 0;
    position: sticky;
    bottom: 0;
    background-color: var(--header-bg);
    margin-left: -20px;
    margin-right: -20px;
    margin-bottom: -20px;
    margin-top: 20px;
    padding: 10px 20px;

    ::v-deep .spacer-small {
      padding: 0;
    }
  }

  .input-fieldset {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;

    &.condensed {
      gap: 0.25rem;
    }

    &.pt-12 {
      padding-top: 3rem;
    }
  }

  .input-field {
    max-width: 24rem
  }

  .input-detail {
    color: var(--input-label);
    padding-left: 61px;
  }
</style>
