<script>
import CruResource from '@/components/CruResource';
import ArrayList from '@/components/form/ArrayList';
import KeyValue from '@/components/form/KeyValue';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import CreateEditView from '@/mixins/create-edit-view';
import { defaultAsyncData } from '@/components/ResourceDetail';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import { MONITORING } from '@/config/types';
import Banner from '@/components/Banner';
import { createDefaultRouteName } from '@/utils/alertmanagerconfig';
import Loading from '@/components/Loading';

export default {
  components: {
    ArrayList, Banner, CruResource, KeyValue, LabeledInput, LabeledSelect, Loading, Tab, Tabbed
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
  asyncData(ctx) {
    function yamlSave(value, originalValue) {
      originalValue.yamlSaveOverride(value, originalValue);
    }

    return defaultAsyncData(ctx, null, {
      hideBanner: true, hideAge: true, hideBadgeState: true, yamlSave
    });
  },
  data() {
    this.$set(this.value.spec, 'group_by', this.value.spec.group_by || []);

    return { receiverOptions: [] };
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
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <div v-if="!isView" class="row mb-10">
      <div class="col span-6">
        <LabeledInput v-model="value.spec.name" :disabled="true" :label="t('generic.name')" :mode="mode" />
      </div>
    </div>
    <Banner v-if="value.isRoot" color="info">
      This is the top-level Route used by Alertmanager as the default destination for any Alerts that do not match any other Routes. This Route must exist and cannot be deleted.
    </Banner>
    <Tabbed ref="tabbed" :side-tabs="true" default-tab="overview">
      <Tab label="Receiver" :weight="2" name="receiver">
        <div class="row">
          <div class="col span-6">
            <LabeledSelect v-model="value.spec.receiver" :options="receiverOptions" label="Receiver" :mode="mode" />
          </div>
        </div>
      </Tab>
      <Tab label="Grouping" :weight="1" name="groups">
        <div class="row mb-20">
          <div class="col span-6">
            <span class="label">
              Group By:
            </span>
            <ArrayList v-if="!isView || value.spec.group_by.length > 0" v-model="value.spec.group_by" label="Group By" :mode="mode" :initial-empty-row="true" />
            <div v-else>
              {{ t('generic.none') }}
            </div>
          </div>
        </div>
        <hr class="divider" />
        <div class="row mb-10">
          <div class="col span-6">
            <LabeledInput v-model="value.spec.group_wait" label="Group Wait" :mode="mode" />
          </div>
          <div class="col span-6">
            <LabeledInput v-model="value.spec.group_interval" label="Group Interval" :mode="mode" />
          </div>
        </div>
        <div class="row mb-10">
          <div class="col span-6">
            <LabeledInput v-model="value.spec.repeat_interval" label="Repeat Interval" :mode="mode" />
          </div>
        </div>
      </Tab>
      <Tab label="Matching" :weight="1" name="matching">
        <Banner v-if="value.isRoot" color="info">
          The root route has to match everything so matching can't be configured.
        </Banner>
        <div v-else class="row">
          <div class="col span-6">
            <span class="label">
              Match:
            </span>
            <KeyValue
              v-if="!isView || Object.keys(value.spec.match || {}).length > 0"
              v-model="value.spec.match"
              :disabled="value.isRoot"
              :options="receiverOptions"
              label="Receiver"
              :mode="mode"
            />
            <div v-else>
              {{ t('generic.none') }}
            </div>
          </div>
          <div class="col span-6">
            <span class="label">
              Match Regex:
            </span>
            <KeyValue
              v-if="!isView || Object.keys(value.spec.match_re || {}).length > 0"
              v-model="value.spec.match_re"
              :disabled="value.isRoot"
              :options="receiverOptions"
              label="Receiver"
              :mode="mode"
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
