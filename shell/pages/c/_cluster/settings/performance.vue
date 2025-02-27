<script>
import { Checkbox } from '@components/Form/Checkbox';
import Loading from '@shell/components/Loading';
import AsyncButton from '@shell/components/AsyncButton';
import { Banner } from '@components/Banner';
import { LabeledInput } from '@components/Form/LabeledInput';
import { MANAGEMENT } from '@shell/config/types';
import { DEFAULT_PERF_SETTING, SETTING } from '@shell/config/settings';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import UnitInput from '@shell/components/form/UnitInput';
import { STEVE_CACHE } from '@shell/store/features';
import { NAME as SETTING_PRODUCT } from '@shell/config/product/settings';
import paginationUtils from '@shell/utils/pagination-utils';
import Collapse from '@shell/components/Collapse';

const incompatible = {
  incrementalLoading: ['forceNsFilterV2', 'serverPagination'],
  manualRefresh:      ['forceNsFilterV2', 'serverPagination'],
  forceNsFilterV2:    ['incrementalLoading', 'manualRefresh'],
  serverPagination:   ['incrementalLoading', 'manualRefresh'],
};

const l10n = {
  incrementalLoading: 'incrementalLoad',
  manualRefresh:      'manualRefresh',
  forceNsFilterV2:    'nsFiltering',
  serverPagination:   'serverPagination'
};

export default {
  components: {
    Checkbox,
    Loading,
    AsyncButton,
    Banner,
    LabeledInput,
    UnitInput,
    Collapse,
  },

  async fetch() {
    try {
      this.uiPerfSetting = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.UI_PERFORMANCE });
    } catch {
      this.uiPerfSetting = await this.$store.dispatch('management/create', { type: MANAGEMENT.SETTING }, { root: true });
      // Setting does not exist - create a new one
      this.uiPerfSetting.value = JSON.stringify(DEFAULT_PERF_SETTING);
      this.uiPerfSetting.metadata = { name: SETTING.UI_PERFORMANCE };
    }

    try {
      this.authUserTTL = await this.$store.dispatch(`management/find`, { type: MANAGEMENT.SETTING, id: SETTING.AUTH_USER_SESSION_TTL_MINUTES });
    } catch {}

    const sValue = this.uiPerfSetting?.value || JSON.stringify(DEFAULT_PERF_SETTING);

    this.value = {
      ...DEFAULT_PERF_SETTING,
      ...JSON.parse(sValue),
    };

    this.gcStartedEnabled = this.value.garbageCollection.enabled;
  },

  data() {
    return {
      uiPerfSetting:              null,
      authUserTTL:                null,
      bannerVal:                  {},
      value:                      {},
      errors:                     [],
      gcStartedEnabled:           null,
      isInactivityThresholdValid: false,
      ffUrl:                      this.$router.resolve({
        name:   'c-cluster-product-resource',
        params: {
          product:  SETTING_PRODUCT,
          resource: MANAGEMENT.FEATURE
        }
      }).href,
      ssPApplicableTypesOpen: false,
    };
  },

  computed: {
    mode() {
      const schema = this.$store.getters[`management/schemaFor`](MANAGEMENT.SETTING);

      return schema?.resourceMethods?.includes('PUT') ? _EDIT : _VIEW;
    },

    canSave() {
      return this.value.inactivity.enabled ? this.isInactivityThresholdValid : true;
    },

    steveCacheEnabled() {
      return this.$store.getters['features/get'](STEVE_CACHE);
    },

    steveCacheAndSSPEnabled() {
      return this.steveCacheEnabled && this.value.serverPagination.enabled;
    },

    sspApplicableResources() {
      const storeResources = [];
      const stores = paginationUtils.getStoreSettings(this.value.serverPagination);

      Object.entries(stores).forEach(([store, settings]) => {
        const resources = [];

        if (settings.resources.enableAll) {
          resources.push(this.t('performance.serverPagination.resources.all'));
        } else {
          settings.resources.enableSome.enabled.forEach((resource) => {
            resources.push(!!resource.length ? resource : `${ resource.resource } (${ resource.context })`);
          });
          if (settings.resources.enableSome.generic) {
            resources.push(this.t('performance.serverPagination.resources.generic', {}, true));
          }
        }

        storeResources.push(`Resources in store '${ store }': ${ resources.join(', ') }`);
      });

      return storeResources.join('<br><br>');
    }
  },

  methods: {
    validateInactivityThreshold(value) {
      if (!this.authUserTTL?.value) {
        this.isInactivityThresholdValid = true;

        return;
      }

      if (parseInt(value) > parseInt(this.authUserTTL?.value)) {
        this.isInactivityThresholdValid = false;

        return this.t('performance.inactivity.authUserTTL', { current: this.authUserTTL.value });
      }
      this.isInactivityThresholdValid = true;
    },

    async save(btnCB) {
      this.uiPerfSetting.value = JSON.stringify(this.value);
      this.errors = [];

      try {
        await this.uiPerfSetting.save();

        this.$store.dispatch('gcPreferencesUpdated', {
          previouslyEnabled: this.gcStartedEnabled,
          newPreferences:    this.value.garbageCollection
        }, { root: true });

        this.gcStartedEnabled = this.value.garbageCollection.enabled;
        btnCB(true);
      } catch (err) {
        this.errors.push(err);
        btnCB(false);
      }
    },

    compatibleWarning(property, enabled) {
      if (!enabled) {
        // Disabling a preference won't automatically turn on an incompatible one, so just set and exit
        this.value[property].enabled = false;

        return;
      }

      // We're enabling a preference. Are there any incompatible preferences?
      if ((incompatible[property] || []).every((p) => !this.value[p].enabled)) {
        // No, just set and exit
        this.value[property].enabled = true;

        return;
      }

      // Incompatible preferences found, so confirm with user before applying
      this.$store.dispatch('cluster/promptModal', {
        component:      'GenericPrompt',
        componentProps: {
          applyMode: 'continue',
          confirm:   (confirmed) => {
            this.value[property].enabled = confirmed;
          },
          applyAction: (buttonDone) => {
            (incompatible[property] || []).forEach((incompatible) => {
              this.value[incompatible].enabled = false;
            });
            buttonDone(true);
          },
          title: this.t('promptRemove.title', {}, true),
          body:  this.t(`performance.${ l10n[property] }.incompatibleDescription`, {}, true),
        },
      });
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <h1 class="mb-20">
      {{ t('performance.label') }}
    </h1>
    <div>
      <div class="ui-perf-setting">
        <!-- Inactivity -->
        <div class="mt-20">
          <h2>{{ t('performance.inactivity.title') }}</h2>
          <p>{{ t('performance.inactivity.description') }}</p>
          <Checkbox
            v-model:value="value.inactivity.enabled"
            :mode="mode"
            :label="t('performance.inactivity.checkboxLabel')"
            class="mt-10 mb-20"
            :primary="true"
          />
          <div class="ml-20">
            <LabeledInput
              v-model:value="value.inactivity.threshold"
              data-testid="inactivity-threshold"
              :mode="mode"
              :label="t('performance.inactivity.inputLabel')"
              :disabled="!value.inactivity.enabled"
              class="input mb-10"
              type="number"
              min="0"
              :rules="[validateInactivityThreshold]"
            />
            <span
              v-clean-html="t('performance.inactivity.information', {}, true)"
              :class="{ 'text-muted': !value.incrementalLoading.enabled }"
            />
          </div>
        </div>
        <!-- Websocket Notifications -->
        <div class="mt-40">
          <h2>{{ t('performance.websocketNotification.label') }}</h2>
          <p>{{ t('performance.websocketNotification.description') }}</p>
          <Checkbox
            v-model:value="value.disableWebsocketNotification"
            :mode="mode"
            :label="t('performance.websocketNotification.checkboxLabel')"
            class="mt-10 mb-20"
            :primary="true"
          />
        </div>
        <!-- Server Side Pagination -->
        <div class="mt-20">
          <h2 id="ssp-setting">
            {{ t('performance.serverPagination.label') }}
          </h2>
          <p>{{ t('performance.serverPagination.description') }}</p>
          <Banner
            v-if="!steveCacheEnabled"
            v-clean-html="t(`performance.serverPagination.featureFlag`, { ffUrl }, true)"
            color="warning"
          />
          <Banner
            color="error"
            label-key="performance.serverPagination.experimental"
          />
          <Checkbox
            v-model:value="value.serverPagination.enabled"
            :mode="mode"
            :label="t('performance.serverPagination.checkboxLabel')"
            class="mt-10 mb-10"
            :primary="true"
            :disabled="!steveCacheEnabled"
            @update:value="compatibleWarning('serverPagination', $event)"
          />
          <Collapse
            :title="t('performance.serverPagination.applicable')"
            :open="steveCacheAndSSPEnabled && ssPApplicableTypesOpen"
            :isDisabled="!steveCacheAndSSPEnabled"
            @update:open="ssPApplicableTypesOpen = !ssPApplicableTypesOpen"
          >
            <p
              v-clean-html="sspApplicableResources"
              :class="{ 'text-muted': !value.serverPagination.enabled }"
            />
          </Collapse>
        </div>
        <!-- Incremental Loading -->
        <div class="mt-20">
          <h2>{{ t('performance.incrementalLoad.label') }}</h2>
          <Banner
            color="warning"
          >
            <span v-clean-html="t(`performance.deprecatedForSSP`, { setting: t('performance.incrementalLoad.label') }, true)" />
          </Banner>
          <p>{{ t('performance.incrementalLoad.description') }}</p>
          <Checkbox
            :value="value.incrementalLoading.enabled"
            :mode="mode"
            :label="t('performance.incrementalLoad.checkboxLabel')"
            class="mt-10 mb-20"
            :primary="true"
            @update:value="compatibleWarning('incrementalLoading', $event)"
          />
          <div class="ml-20">
            <p :class="{ 'text-muted': !value.incrementalLoading.enabled }">
              {{ t('performance.incrementalLoad.setting') }}
            </p>
            <LabeledInput
              v-model:value="value.incrementalLoading.threshold"
              :mode="mode"
              :label="t('performance.incrementalLoad.inputLabel')"
              :disabled="!value.incrementalLoading.enabled"
              class="input"
              type="number"
              min="0"
            />
          </div>
        </div>
        <!-- Enable manual refresh list views -->
        <div class="mt-40">
          <h2 v-t="'performance.manualRefresh.label'" />
          <Banner
            color="warning"
          >
            <span v-clean-html="t(`performance.deprecatedForSSP`, { setting: t('performance.manualRefresh.label') }, true)" />
          </Banner>
          <p>{{ t('performance.manualRefresh.description') }}</p>
          <Checkbox
            :value="value.manualRefresh.enabled"
            :mode="mode"
            :label="t('performance.manualRefresh.checkboxLabel')"
            class="mt-10 mb-20"
            :primary="true"
            @update:value="compatibleWarning('manualRefresh', $event)"
          />
          <div class="ml-20">
            <p :class="{ 'text-muted': !value.manualRefresh.enabled }">
              {{ t('performance.manualRefresh.setting') }}
            </p>
            <LabeledInput
              v-model:value.number="value.manualRefresh.threshold"
              :mode="mode"
              :label="t('performance.manualRefresh.inputLabel')"
              :disabled="!value.manualRefresh.enabled"
              class="input"
              type="number"
              min="0"
            />
          </div>
        </div>
        <!-- Enable GC of resources from store -->
        <div class="mt-40">
          <h2 v-t="'performance.gc.label'" />
          <Banner
            color="warning"
          >
            <span v-clean-html="t(`performance.deprecatedForSSP`, { setting: t('performance.gc.label') }, true)" />
          </Banner>
          <p>{{ t('performance.gc.description') }}</p>
          <Checkbox
            v-model:value="value.garbageCollection.enabled"
            :mode="mode"
            :label="t('performance.gc.checkboxLabel')"
            class="mt-10 mb-20"
            :primary="true"
          />
          <div class="ml-20">
            <h3>{{ t('performance.gc.whenRun.description') }}</h3>
            <div class="ml-20 mb-10">
              <Checkbox
                v-model:value="value.garbageCollection.enabledInterval"
                :mode="mode"
                :class="{ 'text-muted': !value.garbageCollection.enabled }"
                :label="t('performance.gc.whenRun.intervalCheckBox.label')"
                class="mt-10 mb-10"
                :disabled="!value.garbageCollection.enabled"
                :primary="true"
              />
              <div class="ml-20">
                <UnitInput
                  v-model:value="value.garbageCollection.interval"
                  :mode="mode"
                  :suffix="t('suffix.seconds', { count: value.garbageCollection.interval })"
                  :label="t('performance.gc.whenRun.interval.inputLabel')"
                  :disabled="!value.garbageCollection.enabled || !value.garbageCollection.enabledInterval"
                  min="30"
                  class="input"
                />
              </div>
              <Checkbox
                v-model:value="value.garbageCollection.enabledOnNavigate"
                :mode="mode"
                :class="{ 'text-muted': !value.garbageCollection.enabled }"
                :label="t('performance.gc.whenRun.route.description')"
                class="mt-20 mb-10"
                :disabled="!value.garbageCollection.enabled"
                :primary="true"
              />
            </div>
            <h3>{{ t('performance.gc.howRun.description') }}</h3>
            <div class="ml-20">
              <p :class="{ 'text-muted': !value.garbageCollection.enabled }">
                {{ t('performance.gc.howRun.age.description', {}, true) }}
              </p>
              <UnitInput
                v-model:value="value.garbageCollection.ageThreshold"
                :mode="mode"
                :suffix="t('suffix.seconds', { count: value.garbageCollection.ageThreshold })"
                :label="t('performance.gc.howRun.age.inputLabel')"
                :disabled="!value.garbageCollection.enabled"
                min="30"
                class="input"
              />
              <p
                class="mt-20"
                :class="{ 'text-muted': !value.garbageCollection.enabled }"
              >
                {{ t('performance.gc.howRun.count.description') }}
              </p>
              <LabeledInput
                v-model:value.number="value.garbageCollection.countThreshold"
                :mode="mode"
                :label="t('performance.gc.howRun.count.inputLabel')"
                :disabled="!value.garbageCollection.enabled"
                class="input"
                type="number"
                min="0"
              />
            </div>
          </div>
        </div>
        <!-- Force NS filter -->
        <div class="mt-40">
          <h2>{{ t('performance.nsFiltering.label') }}</h2>
          <Banner
            color="warning"
          >
            <span v-clean-html="t(`performance.deprecatedForSSP`, { setting: t('performance.nsFiltering.label') }, true)" />
          </Banner>
          <p>{{ t('performance.nsFiltering.description') }}</p>
          <Checkbox
            :value="value.forceNsFilterV2.enabled"
            :mode="mode"
            :label="t('performance.nsFiltering.checkboxLabel')"
            class="mt-10 mb-20"
            :primary="true"
            @update:value="compatibleWarning('forceNsFilterV2', $event)"
          />
        </div>
        <!-- Advanced Websocket Worker -->
        <div class="mt-20">
          <h2>{{ t('performance.advancedWorker.label') }}</h2>
          <Banner
            color="warning"
          >
            <span v-clean-html="t(`performance.deprecatedForSSP`, { setting: t('performance.advancedWorker.label') }, true)" />
          </Banner>
          <p>{{ t('performance.advancedWorker.description') }}</p>
          <Checkbox
            v-model:value="value.advancedWorker.enabled"
            :mode="mode"
            :label="t('performance.advancedWorker.checkboxLabel')"
            class="mt-10 mb-20"
            :primary="true"
          />
        </div>
      </div>
    </div>
    <template
      v-for="(err, i) in errors"
      :key="i"
    >
      <Banner
        color="error"
        :label="err"
      />
    </template>
    <div v-if="mode === 'edit'">
      <AsyncButton
        data-testid="performance__save-btn"
        class="pull-right mt-20"
        mode="apply"
        :disabled="!canSave"
        @click="save"
      />
    </div>
  </div>
</template>

<style scoped lang='scss'>
.overlay {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background-color: var(--overlay-bg);
  z-index: 1;
}
  .ui-perf-setting {
    P {
      line-height: 1.25;
      margin-bottom: 10px;
    }

    .underline {
      text-decoration: underline;
    }
  }
  .input {
    max-width: 25%;
  }
</style>
