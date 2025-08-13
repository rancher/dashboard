<script lang="ts" setup>
import { ref, watch, onMounted } from 'vue';
import { useRouter, onBeforeRouteUpdate } from 'vue-router';
import { useForm, useIsFormValid, useIsFormDirty } from 'vee-validate';

import UserRetentionHeader from '@shell/components/user.retention/user-retention-header.vue';
import Footer from '@shell/components/form/Footer.vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { useUserRetentionValidation } from '@shell/composables/useUserRetentionValidation';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { isAdminUser } from '@shell/store/type-map';

import type { Setting } from '@shell/types/resources/settings';

import Banner from '@components/Banner/Banner.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import { ToggleSwitch } from '@components/Form/ToggleSwitch';

import dayjs from 'dayjs';

const store = useStore();
const authUserSessionTtlMinutes = ref<Setting | null>(null);
const disableAfterPeriod = ref(false);
const deleteAfterPeriod = ref(false);
const loading = ref(true);
const {
  validateUserRetentionCron,
  validateDisableInactiveUserAfterDuration,
  validateDeleteInactiveUserAfterDuration,
  validateDeleteInactiveUserAfter,
  validateDurationAgainstAuthUserSession,
  removeValidation,
  addValidation,
} = useUserRetentionValidation(disableAfterPeriod, deleteAfterPeriod, authUserSessionTtlMinutes);
let settings: { [id: string]: Setting } = {};

const validationSchema = {
  [SETTING.DISABLE_INACTIVE_USER_AFTER]: (val: string) => {
    const error = validateDisableInactiveUserAfterDuration(val) ||
      validateDurationAgainstAuthUserSession(val);

    return error ?? true;
  },
  [SETTING.DELETE_INACTIVE_USER_AFTER]: (val: string) => {
    const error = validateDeleteInactiveUserAfterDuration(val) ||
      validateDurationAgainstAuthUserSession(val) ||
      validateDeleteInactiveUserAfter(val);

    return error ?? true;
  },
  [SETTING.USER_RETENTION_CRON]: (val: string) => {
    const error = validateUserRetentionCron(val);

    return error ?? true;
  },
};

const initialValues: { [id: string]: string | undefined } = {
  [SETTING.DISABLE_INACTIVE_USER_AFTER]: undefined,
  [SETTING.DELETE_INACTIVE_USER_AFTER]:  undefined,
  [SETTING.USER_RETENTION_CRON]:         undefined,
  [SETTING.USER_RETENTION_DRY_RUN]:      undefined,
  [SETTING.USER_LAST_LOGIN_DEFAULT]:     undefined,
};

const {
  values, errors, defineField, setFieldValue, meta
} = useForm({ validationSchema, initialValues });

const [durationDisable] = defineField(SETTING.DISABLE_INACTIVE_USER_AFTER);
const [durationDelete] = defineField(SETTING.DELETE_INACTIVE_USER_AFTER);
const [userRetentionCron] = defineField(SETTING.USER_RETENTION_CRON);
const [userRetentionDryRun] = defineField(SETTING.USER_RETENTION_DRY_RUN);
const [userLastLoginDefault] = defineField(SETTING.USER_LAST_LOGIN_DEFAULT);

const isFormValid = useIsFormDirty() && useIsFormValid();

/**
 * Watches the disable after period and removes the value if the checkbox is
 * not selected. Lookup the value when the checkbox is selected.
 */
watch(disableAfterPeriod, (newVal) => {
  if (!newVal) {
    setFieldValue(SETTING.DISABLE_INACTIVE_USER_AFTER, undefined);

    return;
  }

  setFieldValue(SETTING.DISABLE_INACTIVE_USER_AFTER, settings[SETTING.DISABLE_INACTIVE_USER_AFTER].value);
});

/**
 * Watches the delete after period and removes the value if the checkbox is
 * not selected. Lookup the value when the checkbox is selected.
 */
watch(deleteAfterPeriod, (newVal) => {
  if (!newVal) {
    setFieldValue(SETTING.DELETE_INACTIVE_USER_AFTER, undefined);

    return;
  }

  setFieldValue(SETTING.DELETE_INACTIVE_USER_AFTER, settings[SETTING.DELETE_INACTIVE_USER_AFTER].value);
});

/**
 * Watches both the disable and delete after periods. Clear all values in
 * the form if both checkboxes are not selected. If one of the checkboxes
 * are selected, lookup each of the values in the form.
 */
watch([disableAfterPeriod, deleteAfterPeriod], ([newDisableAfterPeriod, newDeleteAfterPeriod]) => {
  if (!newDisableAfterPeriod && !newDeleteAfterPeriod) {
    ids.forEach((key) => {
      setFieldValue(key, undefined);
    });

    removeValidation(SETTING.USER_RETENTION_CRON);

    return;
  }

  ids.filter((id) => ![SETTING.DISABLE_INACTIVE_USER_AFTER, SETTING.DELETE_INACTIVE_USER_AFTER].includes(id))
    .forEach(assignSettings);

  addValidation(SETTING.USER_RETENTION_CRON);
});

const assignSettings = (key: string) => {
  if (settings[key].id === SETTING.USER_LAST_LOGIN_DEFAULT && settings[key].value && typeof settings[key].value === 'string') {
    const value = settings[key].value as string;

    setFieldValue(key, dayjs(value).valueOf().toString());

    return;
  }

  setFieldValue(key, settings[key].value);
};

const fetchSetting = async(id: string) => {
  return await store.dispatch('management/find', { type: MANAGEMENT.SETTING, id });
};

const ids = Object.keys(values);
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

  authUserSessionTtlMinutes.value = await fetchSetting(SETTING.AUTH_USER_SESSION_TTL_MINUTES);

  disableAfterPeriod.value = !!values[SETTING.DISABLE_INACTIVE_USER_AFTER];
  deleteAfterPeriod.value = !!values[SETTING.DELETE_INACTIVE_USER_AFTER];
  loading.value = false;
});

const { t } = useI18n(store);
const error = ref<string | null>(null);
const save = async(btnCB: (arg: boolean) => void) => {
  try {
    error.value = null;
    ids.forEach((key) => {
      settings[key].value = values[key];

      if (key === SETTING.USER_LAST_LOGIN_DEFAULT && values[key]) {
        settings[key].value = dayjs(Number(values[key])).format();
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
  <div class="user-retention">
    <div class="user-retention-content">
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
            v-model:value="disableAfterPeriod"
            data-testid="disableAfterPeriod"
            :label="t('user.retention.edit.form.disableAfter.checkbox')"
          />
          <labeled-input
            v-model:value="durationDisable"
            data-testid="disableAfterPeriodInput"
            :tooltip="t('user.retention.edit.form.disableAfter.input.tooltip')"
            class="input-field"
            :label="t('user.retention.edit.form.disableAfter.input.label')"
            :disabled="!disableAfterPeriod"
            :error-message="errors[SETTING.DISABLE_INACTIVE_USER_AFTER]"
          />
        </div>
        <div class="input-fieldset">
          <checkbox
            v-model:value="deleteAfterPeriod"
            data-testid="deleteAfterPeriod"
            :label="t('user.retention.edit.form.deleteAfter.checkbox')"
          />
          <labeled-input
            v-model:value="durationDelete"
            data-testid="deleteAfterPeriodInput"
            :tooltip="t('user.retention.edit.form.deleteAfter.input.tooltip')"
            class="input-field"
            :label="t('user.retention.edit.form.deleteAfter.input.label')"
            :sub-label="t('user.retention.edit.form.deleteAfter.input.subLabel')"
            :disabled="!deleteAfterPeriod"
            :error-message="errors[SETTING.DELETE_INACTIVE_USER_AFTER]"
          />
        </div>
        <template
          v-if="disableAfterPeriod || deleteAfterPeriod"
        >
          <div class="input-fieldset pt-12">
            <labeled-input
              v-model:value="userRetentionCron"
              data-testid="userRetentionCron"
              class="input-field"
              required
              type="cron"
              :tooltip="t('user.retention.edit.form.cron.subLabel')"
              :label="t('user.retention.edit.form.cron.label')"
              :require-dirty="false"
              :error-message="errors[SETTING.USER_RETENTION_CRON]"
            />
          </div>
          <div class="input-fieldset condensed pt-12">
            <toggle-switch
              v-model:value="userRetentionDryRun"
              data-testid="userRetentionDryRun"
              :onValue="'true'"
              :offValue="'false'"
              :on-label="t('user.retention.edit.form.dryRun.label')"
            />
            <span class="input-detail">{{ t('user.retention.edit.form.dryRun.subLabel') }}</span>
          </div>
          <div class="input-fieldset condensed">
            <labeled-input
              v-model:value="userLastLoginDefault"
              data-testid="userLastLoginDefault"
              class="input-field"
              :label="t('user.retention.edit.form.defaultLastLogin.label')"
              :sub-label="t('user.retention.edit.form.defaultLastLogin.subLabel')"
              :placeholder="t('user.retention.edit.form.defaultLastLogin.placeholder')"
            />
          </div>
        </template>
      </div>
    </div>
    <pre>values: {{ values }}</pre>
    <pre>errors: {{ errors }}</pre>
    <pre>meta: {{ meta }}</pre>
    <pre>isFormValid: {{ isFormValid }}</pre>
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
  .user-retention {
    height: 100%;
  }

  .user-retention-content {
    height: 100%;
    overflow-y: scroll;
  }

  .form-user-retention {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 1.5rem;
  }

  .footer-user-retention {
    border-top: var(--header-border-size) solid var(--header-border);
    background-color: var(--header-bg);
    margin-left: -20px;
    margin-right: -20px;
    margin-bottom: -20px;
    margin-top: 20px;
    padding: 10px 20px;
    height: $footer-height;

    :deep() .spacer-small {
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
