<script lang="ts" setup>
import { ref, reactive, watch, onMounted } from 'vue';
import { useRouter, onBeforeRouteUpdate } from 'vue-router/composables';

import UserRetentionHeader from '@shell/components/user.retention/user-retention-header';
import Footer from '@shell/components/form/Footer';
import { useStore } from '@shell/composables/useStore';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { isAdminUser } from '@shell/store/type-map';

import Banner from '@components/Banner/Banner.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import { ToggleSwitch } from '@components/Form/ToggleSwitch';

import { isValidCron } from 'cron-validator';

type Links = {
  remove: string;
  self: string;
  update: string;
  view: string;
};

type FieldsV1 = {
  'f:customized': {};
  'f:default': {};
  'f:source': {};
  'f:value': {};
};

type ManagedFields = {
  apiVersion: string;
  fieldsType: string;
  fieldsV1: FieldsV1;
  manager: string;
  operation: string;
  time: string;
};

type Metadata = {
  creationTimestamp: string;
  fields: string[];
  generation: number;
  managedFields: ManagedFields[];
  name: string;
  relationships: null;
  resourceVersion: string;
  state: {
    error: boolean;
    message: string;
    name: string;
    transitioning: boolean;
  };
  uid: string;
};

type Setting = {
  id: string;
  type: string;
  links: Links;
  apiVersion: string;
  customized: boolean;
  default: string;
  kind: string;
  metadata: Metadata;
  source: string;
  value: string | null;
  save: () => void;
};

const store = useStore();
const userRetentionSettings = reactive<{[id: string]: string | null }>({
  [SETTING.DISABLE_INACTIVE_USER_AFTER]: null,
  [SETTING.DELETE_INACTIVE_USER_AFTER]:  null,
  [SETTING.USER_RETENTION_CRON]:         null,
  [SETTING.USER_RETENTION_DRY_RUN]:      null,
  [SETTING.USER_LAST_LOGIN_DEFAULT]:     null,
});
const disableAfterPeriod = ref(false);
const deleteAfterPeriod = ref(false);
const loading = ref(true);
let settings: { [id: string]: Setting } = {};

/**
 * Watches the disable after period and removes the value if the checkbox is
 * not selected. Lookup the value when the checkbox is selected.
 */
watch(disableAfterPeriod, (newVal) => {
  if (!newVal) {
    userRetentionSettings[SETTING.DISABLE_INACTIVE_USER_AFTER] = null;

    return;
  }

  userRetentionSettings[SETTING.DISABLE_INACTIVE_USER_AFTER] = settings[SETTING.DISABLE_INACTIVE_USER_AFTER].value;
});

/**
 * Watches the delete after period and removes the value if the checkbox is
 * not selected. Lookup the value when the checkbox is selected.
 */
watch(deleteAfterPeriod, (newVal) => {
  if (!newVal) {
    userRetentionSettings[SETTING.DELETE_INACTIVE_USER_AFTER] = null;

    return;
  }

  userRetentionSettings[SETTING.DELETE_INACTIVE_USER_AFTER] = settings[SETTING.DELETE_INACTIVE_USER_AFTER].value;
});

/**
 * Watches both the disable and delete after periods. Clear all values in
 * the form if both checkboxes are not selected. If one of the checkboxes
 * are selected, lookup each of the values in the form.
 */
watch([disableAfterPeriod, deleteAfterPeriod], ([newDisableAfterPeriod, newDeleteAfterPeriod]) => {
  if (!newDisableAfterPeriod && !newDeleteAfterPeriod) {
    ids.forEach((key) => {
      userRetentionSettings[key] = null;
    });

    return;
  }

  ids.filter((id) => ![SETTING.DISABLE_INACTIVE_USER_AFTER, SETTING.DELETE_INACTIVE_USER_AFTER].includes(id))
    .forEach((key) => {
      if (userRetentionSettings[key] === null) {
        userRetentionSettings[key] = settings[key].value;
      }
    });
});

const fetchSetting = async(id: string) => {
  return await store.dispatch('management/find', { type: MANAGEMENT.SETTING, id });
};

const ids = Object.keys(userRetentionSettings);
const settingPromises = ids.map((id) => fetchSetting(id));

onMounted(async() => {
  settings = await Promise
    .all(settingPromises)
    .then((results) => results.reduce((acc, result) => {
      return {
        [result.id]: result,
        ...acc,
      };
    }, { }));

  ids.forEach((key) => {
    userRetentionSettings[key] = settings[key].value;
  });

  disableAfterPeriod.value = !!userRetentionSettings[SETTING.DISABLE_INACTIVE_USER_AFTER];
  deleteAfterPeriod.value = !!userRetentionSettings[SETTING.DELETE_INACTIVE_USER_AFTER];
  loading.value = false;

  validateUserRetentionCron();
});

const isFormValid = ref(false);
const validateUserRetentionCron = () => {
  const { [SETTING.USER_RETENTION_CRON]: cronSetting } = userRetentionSettings;

  // Only require user retention cron when disable or delete after are active
  if (!disableAfterPeriod.value && !deleteAfterPeriod.value) {
    isFormValid.value = true;

    return;
  }

  if (!cronSetting) {
    isFormValid.value = false;

    return;
  }

  if (typeof cronSetting === 'string' && !isValidCron(cronSetting)) {
    isFormValid.value = false;

    return;
  }

  isFormValid.value = true;
};

const error = ref<string | null>(null);
const save = async(btnCB: (arg: boolean) => void) => {
  try {
    error.value = null;
    ids.forEach((key) => {
      settings[key].value = userRetentionSettings[key];
    });

    await Promise.all(ids.map((setting) => settings[setting].save()));

    btnCB(true);
    store.dispatch(
      'growl/success',
      {
        title:   'Save user retention settings',
        message: 'User retention settings have been updated successfully',
      },
      { root: true }
    );
    routeBack();
  } catch (err) {
    error.value = (err as Error).message;
    btnCB(false);
  }
};

const router = useRouter();
const routeBack = () => {
  router.back();
};

onBeforeRouteUpdate((_to, _from) => {
  if (!isAdminUser(store.getters)) {
    router.replace({ name: 'home' });
  }
});
</script>

<template>
  <div>
    <user-retention-header />
    <div
      v-if="!loading"
      class="form-user-retention"
    >
      <banner
        v-if="error"
        color="error"
      >
        {{ error }}
      </banner>
      <div class="input-fieldset">
        <checkbox
          v-model="disableAfterPeriod"
          label="Disable user accounts after an inactivity  period (days since last login)"
        />
        <labeled-input
          v-model="userRetentionSettings[SETTING.DISABLE_INACTIVE_USER_AFTER]"
          tooltip="Uses duration units (i.e. use 30d for 30 days)"
          class="input-field"
          label="Inactivity period"
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
          tooltip="Uses duration units (i.e. use 30d for 30 days)"
          class="input-field"
          label="Inactivity period"
          sub-label="This value must be larger than the Disable period, if it's active"
          :disabled="!deleteAfterPeriod"
        />
      </div>
      <template
        v-if="disableAfterPeriod || deleteAfterPeriod"
      >
        <div class="input-fieldset pt-12">
          <labeled-input
            v-model="userRetentionSettings[SETTING.USER_RETENTION_CRON]"
            class="input-field"
            required
            type="cron"
            label="User retention process schedule"
            sub-label="The user retention process runs as a cron job (required)"
            @input="validateUserRetentionCron"
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
      :disable-save="!isFormValid"
      @save="save"
      @done="routeBack"
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
