<script>
import ArrayList from '@/components/form/ArrayList';
import KeyValue from '@/components/form/KeyValue';
import LabeledInput from '@/components/form/LabeledInput';
import { _VIEW } from '@/config/query-params';

export default {
  components: {
    ArrayList,
    KeyValue,
    LabeledInput,
  },
  props: {
    mode: {
      type:     String,
      required: true,
    },
    value: {
      type:     Object,
      required: true
    },
    receiverOptions: {
      type:     Array,
      required: true
    },
  },
  data() {
    return { isView: _VIEW };
  },
  methods: {
    updateSelectValue(event) {
      // this.value.receivers = event;

      this.$set(this.value, 'receivers', event);
    },
  }

};

</script>
<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <!-- ToDo: uncomment and implement this code -->
        <!-- <LabeledSelect
          :value="value.receivers"
          class="lg"
          :label="t('monitoringRoute.receiver.oneOrMoreLabel')"
          :taggable="true"
          :searchable="true"
          :options="receiverOptions"
          :multiple="true"
          :mode="mode"
          :tooltip="t('monitoring.alertmanagerConfig.receiverTooltip')"
          @input="updateSelectValue"
        /> -->
        <v-select>
        </v-select>
      </div>
    </div>
    <h3>Grouping</h3>
    <div class="row mb-20">
      <div class="col span-6">
        <span class="label">
          {{ t("monitoringRoute.groups.label") }}:
        </span>
        <ArrayList
          v-if="!isView || (value.groupBy && value.groupBy.length > 0)"
          v-model="value.groupBy"
          :label="t('monitoringRoute.groups.label')"
          :mode="mode"
          :initial-empty-row="true"
        />
        <div v-else>
          {{ t('generic.none') }}
        </div>
      </div>
    </div>
    <h3>Waiting and Intervals</h3>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.groupWait"
          :label="t('monitoringRoute.wait.label')"
          :mode="mode"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.groupInterval"
          :label="t('monitoringRoute.interval.label')"
          :mode="mode"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.repeatInterval"
          :label="t('monitoringRoute.repeatInterval.label')"
          :mode="mode"
        />
      </div>
    </div>

    <h3>Matching</h3>
    <div class="row mb-20">
      <div class="col span-12">
        <span class="label">
          {{ t('monitoringRoute.matching.label') }}
        </span>
        <KeyValue
          v-if="!isView || Object.keys(value.match || {}).length > 0"
          v-model="value.match"
          :options="receiverOptions"
          :label="t('monitoringRoute.receiver.label')"
          :mode="mode"
          :read-allowed="false"
          :add-label="t('monitoringRoute.receiver.addMatch')"
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
          v-if="!isView || Object.keys(value.matchers || {}).length > 0"
          v-model="value.matchers"
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
  </div>
</template>
