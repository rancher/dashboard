<script lang="ts" setup>
import { ref, reactive, watch, onMounted } from 'vue';
import { useRouter, onBeforeRouteUpdate } from 'vue-router/composables';

import UserRetentionHeader from '@shell/components/user.retention/user-retention-header.vue';
import Footer from '@shell/components/form/Footer.vue';
import { useStore } from '@shell/composables/useStore';
import { useI18n } from '@shell/composables/useI18n';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { isAdminUser } from '@shell/store/type-map';

import Banner from '@components/Banner/Banner.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import { ToggleSwitch } from '@components/Form/ToggleSwitch';

import { isValidCron } from 'cron-validator';
import dayjs from 'dayjs';

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

    validateUserRetentionCron();

    return;
  }

  ids.filter((id) => ![SETTING.DISABLE_INACTIVE_USER_AFTER, SETTING.DELETE_INACTIVE_USER_AFTER].includes(id))
    .forEach(assignSettings);

  validateUserRetentionCron();
});

const assignSettings = (key: string) => {
  if (settings[key].id === SETTING.USER_LAST_LOGIN_DEFAULT && settings[key].value && typeof settings[key].value === 'string') {
    const value = settings[key].value as string;

    userRetentionSettings[key] = dayjs(value).valueOf().toString();

    return;
  }

  userRetentionSettings[key] = settings[key].value;
};

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

  ids.forEach(assignSettings);

  disableAfterPeriod.value = !!userRetentionSettings[SETTING.DISABLE_INACTIVE_USER_AFTER];
  deleteAfterPeriod.value = !!userRetentionSettings[SETTING.DELETE_INACTIVE_USER_AFTER];
  loading.value = false;

  validateUserRetentionCron();
});

const isFormValid = ref(false);
const { t } = useI18n(store);
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

    return t('user.retention.edit.form.cron.errorMessage');
  }

  isFormValid.value = true;
};

const error = ref<string | null>(null);
const save = async(btnCB: (arg: boolean) => void) => {
  try {
    error.value = null;
    ids.forEach((key) => {
      settings[key].value = userRetentionSettings[key];

      if (key === SETTING.USER_LAST_LOGIN_DEFAULT && userRetentionSettings[key]) {
        settings[key].value = dayjs(Number(userRetentionSettings[key])).format();
      }
    });

    await Promise.all(ids.map((setting) => settings[setting].save()));

    btnCB(true);
    store.dispatch(
      'growl/success',
      {
        title:   t('user.retention.growl.title'),
        message: t('user.retention.growl.message'),
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

onBeforeRouteUpdate((_to: unknown, _from: unknown) => {
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
          data-testid="disableAfterPeriod"
          :label="t('user.retention.edit.form.disableAfter.checkbox')"
        />
        <labeled-input
          v-model="userRetentionSettings[SETTING.DISABLE_INACTIVE_USER_AFTER]"
          data-testid="disableAfterPeriodInput"
          :tooltip="t('user.retention.edit.form.disableAfter.input.tooltip')"
          class="input-field"
          :label="t('user.retention.edit.form.disableAfter.input.label')"
          :disabled="!disableAfterPeriod"
        />
      </div>
      <div class="input-fieldset">
        <checkbox
          v-model="deleteAfterPeriod"
          data-testid="deleteAfterPeriod"
          :label="t('user.retention.edit.form.deleteAfter.checkbox')"
        />
        <labeled-input
          v-model="userRetentionSettings[SETTING.DELETE_INACTIVE_USER_AFTER]"
          data-testid="deleteAfterPeriodInput"
          :tooltip="t('user.retention.edit.form.deleteAfter.input.tooltip')"
          class="input-field"
          :label="t('user.retention.edit.form.deleteAfter.input.label')"
          :sub-label="t('user.retention.edit.form.deleteAfter.input.subLabel')"
          :disabled="!deleteAfterPeriod"
        />
      </div>
      <template
        v-if="disableAfterPeriod || deleteAfterPeriod"
      >
        <div class="input-fieldset pt-12">
          <labeled-input
            v-model="userRetentionSettings[SETTING.USER_RETENTION_CRON]"
            data-testid="userRetentionCron"
            class="input-field"
            required
            type="cron"
            :tooltip="t('user.retention.edit.form.cron.subLabel')"
            :rules="[validateUserRetentionCron]"
            :label="t('user.retention.edit.form.cron.label')"
            @input="validateUserRetentionCron"
          />
        </div>
        <div class="input-fieldset condensed pt-12">
          <toggle-switch
            v-model="userRetentionSettings[SETTING.USER_RETENTION_DRY_RUN]"
            data-testid="userRetentionDryRun"
            :onValue="'true'"
            :offValue="'false'"
            :on-label="t('user.retention.edit.form.dryRun.label')"
          />
          <span class="input-detail">{{ t('user.retention.edit.form.dryRun.subLabel') }}</span>
        </div>
        <div class="input-fieldset condensed">
          <labeled-input
            v-model="userRetentionSettings[SETTING.USER_LAST_LOGIN_DEFAULT]"
            data-testid="userLastLoginDefault"
            class="input-field"
            :label="t('user.retention.edit.form.defaultLastLogin.label')"
            :sub-label="t('user.retention.edit.form.defaultLastLogin.subLabel')"
            :placeholder="t('user.retention.edit.form.defaultLastLogin.placeholder')"
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
