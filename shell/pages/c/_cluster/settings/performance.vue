<script>
import { Checkbox } from '@components/Form/Checkbox';
import Loading from '@shell/components/Loading';
import AsyncButton from '@shell/components/AsyncButton';
import { Banner } from '@components/Banner';
import { MANAGEMENT } from '@shell/config/types';
import { DEFAULT_PERF_SETTING, SETTING } from '@shell/config/settings';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { STEVE_CACHE } from '@shell/store/features';
import paginationUtils from '@shell/utils/pagination-utils';
import Collapse from '@shell/components/Collapse';

export default {
  components: {
    Checkbox,
    Loading,
    AsyncButton,
    Banner,
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

    const sValue = this.uiPerfSetting?.value || JSON.stringify(DEFAULT_PERF_SETTING);

    this.value = {
      ...DEFAULT_PERF_SETTING,
      ...JSON.parse(sValue),
    };
  },

  data() {
    return {
      uiPerfSetting:          null,
      bannerVal:              {},
      value:                  {},
      errors:                 [],
      ssPApplicableTypesOpen: false,
    };
  },

  computed: {
    mode() {
      const schema = this.$store.getters[`management/schemaFor`](MANAGEMENT.SETTING);

      return schema?.resourceMethods?.includes('PUT') ? _EDIT : _VIEW;
    },

    steveCacheEnabled() {
      return this.$store.getters['features/get'](STEVE_CACHE);
    },

    sspApplicableResources() {
      const storeResources = [];
      const stores = paginationUtils.getStoreSettings(this.value.serverPagination);

      Object.entries(stores).forEach(([store, settings]) => {
        const resources = [];

        if (settings.resources.enableAll) {
          resources.push(this.t('performance.serverPagination.resources.all'));
        } else {
          settings.resources.enableSome.enabled?.forEach((resource) => {
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
    async save(btnCB) {
      this.uiPerfSetting.value = JSON.stringify(this.value);
      this.errors = [];

      try {
        await this.uiPerfSetting.save();

        btnCB(true);
      } catch (err) {
        this.errors.push(err);
        btnCB(false);
      }
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <h1>
      {{ t('performance.label') }}
    </h1>
    <div>
      <div class="ui-perf-setting">
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
          <Collapse
            :title="t('performance.serverPagination.applicable')"
            :open="steveCacheEnabled && ssPApplicableTypesOpen"
            :isDisabled="!steveCacheEnabled"
            @update:open="ssPApplicableTypesOpen = !ssPApplicableTypesOpen"
          >
            <p
              v-clean-html="sspApplicableResources"
              :class="{ 'text-muted': !value.serverPagination.enabled }"
            />
          </Collapse>
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
