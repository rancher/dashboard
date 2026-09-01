<script>
import ArrayList from '@shell/components/form/ArrayList';
import { Banner } from '@components/Banner';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { _VIEW } from '@shell/config/query-params';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';

export default {
  components: {
    ArrayList,
    Banner,
    ArrayListGrouped,
    LabeledInput,
    LabeledSelect,
  },
  props: {
    mode: {
      type:     String,
      required: true,
    },
    value: {
      type:     Object,
      required: true,
    },
    receiverOptions: {
      type:     Array,
      required: true,
    },
  },
  data() {
    this.value['matchers'] = this.value.matchers || [];
    this.value['groupBy'] = this.value.groupBy || [];

    return {
      isView:     _VIEW,
      matchTypes: [
        { label: 'Match Equal', value: '=' },
        { label: 'Match Not Equal', value: '!=' },
        { label: 'Match Regexp', value: '=~' },
        { label: 'Match Not Regexp', value: '!~' },
      ],
    };
  },
};
</script>
<template>
  <div>
    <h3>
      Receiver
      <i
        v-clean-tooltip="t('monitoring.alertmanagerConfig.receiverTooltip')"
        class="icon icon-info"
      />
    </h3>
    <Banner
      color="info"
      :label="t('monitoring.alertmanagerConfig.routeInfo')"
    />
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledSelect
          v-model:value="value.receiver"
          :mode="mode"
          :options="receiverOptions"
        />
      </div>
    </div>
    <h3>Grouping</h3>
    <div class="row mb-20">
      <div class="col span-6">
        <span class="label">
          {{ t("monitoringRoute.groups.addGroupByLabel'") }}
          <i
            v-clean-tooltip="t('monitoringRoute.groups.groupByTooltip')"
            class="icon icon-info"
          />
        </span>
        <ArrayList
          v-model:value="value.groupBy"
          class="mt-10"
          :mode="mode"
          :initial-empty-row="true"
        />
      </div>
    </div>
    <h3>Waiting and Intervals</h3>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.groupWait"
          :label="t('monitoringRoute.wait.label')"
          :mode="mode"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.groupInterval"
          :label="t('monitoringRoute.interval.label')"
          :mode="mode"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.repeatInterval"
          :label="t('monitoringRoute.repeatInterval.label')"
          :mode="mode"
        />
      </div>
    </div>

    <h3>Matchers</h3>
    <ArrayListGrouped
      v-model:value="value.matchers"
      class="mt-20"
      :mode="mode"
      :add-label="t('monitoringRoute.matching.addMatcher')"
      :default-add-value="{ matchers: [] }"
    >
      <template #default="props">
        <div class="row mt-20 mb-20">
          <div class="col span-4">
            <LabeledInput
              v-model:value="props.row.value.name"
              :label="t('monitoringRoute.matching.name')"
              :tooltip="t('monitoringRoute.matching.nameTooltip')"
              :mode="mode"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              v-model:value="props.row.value.value"
              :label="t('monitoringRoute.matching.value')"
              :tooltip="t('monitoringRoute.matching.valueTooltip')"
              :mode="mode"
            />
          </div>
          <div class="col span-4">
            <LabeledSelect
              v-model:value="props.row.value.matchType"
              :label="t('monitoringRoute.matching.matchType')"
              :mode="mode"
              :options="matchTypes"
            />
          </div>
        </div>
      </template>
    </ArrayListGrouped>
  </div>
</template>
