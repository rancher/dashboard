<script>
/**
 * The Route and Receiver resources are deprecated. Going forward,
 * routes and receivers should be configured within AlertmanagerConfigs.
 * Any updates to route configuration should be made to the route form
 * that is based on the AlertmanagerConfig resource, which has a
 * different API. The new forms are located in
 * @shell/edit/monitoring.coreos.com.alertmanagerconfig/routeConfig.vue.
 */
import CruResource from '@shell/components/CruResource';
import ArrayList from '@shell/components/form/ArrayList';
import KeyValue from '@shell/components/form/KeyValue';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import CreateEditView from '@shell/mixins/create-edit-view';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import { MONITORING } from '@shell/config/types';
import { Banner } from '@components/Banner';
import { createDefaultRouteName } from '@shell/utils/alertmanagerconfig';
import Loading from '@shell/components/Loading';

export default {
  components: {
    ArrayList,
    Banner,
    CruResource,
    KeyValue,
    LabeledInput,
    LabeledSelect,
    Loading,
    Tab,
    Tabbed
  },

  mixins: [CreateEditView],

  async fetch() {
    const receivers = this.$store.dispatch('cluster/findAll', { type: MONITORING.SPOOFED.RECEIVER });
    const routes = this.$store.dispatch('cluster/findAll', { type: MONITORING.SPOOFED.ROUTE });

    this.receiverOptions = (await receivers).map(receiver => receiver.spec.name);

    if (this.isCreate) {
      const nonRootRoutes = (await routes).filter(route => !route.isRoot);

      this.$set(this.value.spec, 'name', createDefaultRouteName(nonRootRoutes.length));
    }
  },

  data() {
    this.$set(this.value.spec, 'group_by', this.value.spec.group_by || []);

    return {
      receiverOptions:      [],
      doneLocationOverride: {
        name:   'c-cluster-monitoring-route-receiver',
        params: { cluster: this.$store.getters['clusterId'] },
        query:  { resource: MONITORING.SPOOFED.ROUTE }
      }
    };
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    class="route"
    :done-route="doneRoute"
    :errors="errors"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :cancel-event="true"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <div
      v-if="!isView"
      class="row mb-10"
    >
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.name"
          :disabled="true"
          :label="t('generic.name')"
          :mode="mode"
        />
      </div>
    </div>
    <Banner
      v-if="value.isRoot"
      color="info"
    >
      {{ t("monitoringRoute.info") }}
    </Banner>
    <Tabbed
      ref="tabbed"
      :side-tabs="true"
      default-tab="overview"
    >
      <Tab
        label="Receiver"
        :weight="2"
        name="receiver"
      >
        <div class="row">
          <div class="col span-6">
            <LabeledSelect
              v-model="value.spec.receiver"
              :options="receiverOptions"
              :label="t('monitoringRoute.receiver.label')"
              :mode="mode"
            />
          </div>
        </div>
      </Tab>
      <Tab
        label="Grouping"
        :weight="1"
        name="groups"
      >
        <div class="row mb-20">
          <div class="col span-6">
            <span class="label">
              {{ t("monitoringRoute.groups.label") }}:
            </span>
            <ArrayList
              v-if="!isView || value.spec.group_by.length > 0"
              v-model="value.spec.group_by"
              :label="t('monitoringRoute.groups.label')"
              :mode="mode"
              :initial-empty-row="true"
            />
            <div v-else>
              {{ t('generic.none') }}
            </div>
          </div>
        </div>
        <hr class="divider">
        <div class="row mb-10">
          <div class="col span-6">
            <LabeledInput
              v-model="value.spec.group_wait"
              :label="t('monitoringRoute.wait.label')"
              :mode="mode"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model="value.spec.group_interval"
              :label="t('monitoringRoute.interval.label')"
              :mode="mode"
            />
          </div>
        </div>
        <div class="row mb-10">
          <div class="col span-6">
            <LabeledInput
              v-model="value.spec.repeat_interval"
              :label="t('monitoringRoute.repeatInterval.label')"
              :mode="mode"
            />
          </div>
        </div>
      </Tab>
      <Tab
        label="Matching"
        :weight="1"
        name="matching"
      >
        <Banner
          v-if="value.isRoot"
          color="info"
        >
          {{ t('monitoringRoute.matching.info') }}
        </Banner>
        <div
          v-else
          class="row"
        >
          <div class="col span-12">
            <span class="label">
              {{ t('monitoringRoute.matching.label') }}
            </span>
            <KeyValue
              v-if="!isView || Object.keys(value.spec.match || {}).length > 0"
              v-model="value.spec.match"
              :disabled="value.isRoot"
              :options="receiverOptions"
              :label="t('monitoringRoute.receiver.label')"
              :mode="mode"
              :read-allowed="false"
              add-label="Add match"
            />
            <div v-else>
              {{ t('generic.none') }}
            </div>
          </div>
        </div>
        <div class="row mt-40">
          <div class="col span-12">
            <span class="label">
              {{ t('monitoringRoute.regex.label') }}:
            </span>
            <KeyValue
              v-if="!isView || Object.keys(value.spec.match_re || {}).length > 0"
              v-model="value.spec.match_re"
              :disabled="value.isRoot"
              :options="receiverOptions"
              :label="t('monitoringRoute.receiver.label')"
              :mode="mode"
              :read-allowed="false"
              add-label="Add match regex"
            />
            <div v-else>
              {{ t('generic.none') }}
            </div>
          </div>
        </div>
      </Tab>
    </Tabbed>
  </CruResource>
</template>

<style lang="scss">
  .route {
    &[real-mode=view] .label {
      color: var(--input-label);
    }
  }
</style>
