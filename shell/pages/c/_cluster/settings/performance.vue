<script>
import { Checkbox } from '@components/Form/Checkbox';
import Loading from '@shell/components/Loading';
import AsyncButton from '@shell/components/AsyncButton';
import { Banner } from '@components/Banner';
import { LabeledInput } from '@components/Form/LabeledInput';
import { MANAGEMENT } from '@shell/config/types';
import { DEFAULT_PERF_SETTING, SETTING } from '@shell/config/settings';
import { _EDIT, _VIEW } from '@shell/config/query-params';

export default {
  layout:     'authenticated',
  components: {
    Checkbox,
    Loading,
    AsyncButton,
    Banner,
    LabeledInput,
  },

  async fetch() {
    try {
      this.uiPerfSetting = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.UI_PERFORMANCE });
    } catch (e) {
      this.uiPerfSetting = await this.$store.dispatch('management/create', { type: MANAGEMENT.SETTING }, { root: true });
      // Setting does not exist - create a new one
      this.uiPerfSetting.value = JSON.stringify(DEFAULT_PERF_SETTING);
      this.uiPerfSetting.metadata = { name: SETTING.UI_PERFORMANCE };
    }

    const sValue = this.uiPerfSetting?.value || JSON.stringify(DEFAULT_PERF_SETTING);

    this.value = JSON.parse(sValue);
  },

  data() {
    return {
      uiPerfSetting: DEFAULT_PERF_SETTING,
      bannerVal:     {},
      value:         {},
      errors:        [],
    };
  },

  computed: {
    mode() {
      const schema = this.$store.getters[`management/schemaFor`](MANAGEMENT.SETTING);

      return schema?.resourceMethods?.includes('PUT') ? _EDIT : _VIEW;
    },
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
  }
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
        <!-- Websocket Notifications -->
        <div class="mt-40">
          <h2>{{ t('performance.websocketNotification.label') }}</h2>
          <p>{{ t('performance.websocketNotification.description') }}</p>
          <Checkbox
            v-model="value.disableWebsocketNotification"
            :label="t('performance.websocketNotification.checkboxLabel')"
            class="mt-10 mb-20"
            :primary="true"
          />
        </div>
        <!-- Incremental Loading -->
        <div class="mt-40">
          <h2>{{ t('performance.incrementalLoad.label') }}</h2>
          <p>{{ t('performance.incrementalLoad.description') }}</p>
          <Checkbox
            v-model="value.incrementalLoading.enabled"
            :label="t('performance.incrementalLoad.checkboxLabel')"
            class="mt-10 mb-20"
            :primary="true"
          />
          <div class="ml-20">
            <p :class="{ 'text-muted': !value.incrementalLoading.enabled }">
              {{ t('performance.incrementalLoad.setting') }}
            </p>
            <LabeledInput
              v-model="value.incrementalLoading.threshold"
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
          <p>{{ t('performance.manualRefresh.description') }}</p>
          <Banner color="error" label-key="performance.manualRefresh.banner" />
          <Checkbox
            v-model="value.manualRefresh.enabled"
            :label="t('performance.manualRefresh.checkboxLabel')"
            class="mt-10 mb-20"
            :primary="true"
          />
          <div class="ml-20">
            <p :class="{ 'text-muted': !value.manualRefresh.enabled }">
              {{ t('performance.manualRefresh.setting') }}
            </p>
            <LabeledInput
              v-model.number="value.manualRefresh.threshold"
              :label="t('performance.manualRefresh.inputLabel')"
              :disabled="!value.manualRefresh.enabled"
              class="input"
              type="number"
              min="0"
            />
          </div>
        </div>
      </div>
    </div>
    <template v-for="err in errors">
      <Banner :key="err" color="error" :label="err" />
    </template>
    <div v-if="mode === 'edit'">
      <AsyncButton class="pull-right mt-20" mode="apply" @click="save" />
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
