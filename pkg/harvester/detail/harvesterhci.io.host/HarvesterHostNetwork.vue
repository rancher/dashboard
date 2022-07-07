<script>
import LabelValue from '@shell/components/LabelValue';
import InputOrDisplay from '@shell/components/InputOrDisplay';
import { _CREATE } from '@shell/config/query-params';

export default {
  name: 'HarvesterHostNetwork',

  components: {
    LabelValue,
    InputOrDisplay,
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },

    mode: {
      type:    String,
      default: _CREATE,
    },
  },
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-6">
        <LabelValue
          :name="t('generic.name')"
          :value="value.name"
        />
      </div>
      <div class="col span-6">
        <LabelValue
          :name="t('tableHeaders.state')"
          :value="value.state"
        />
      </div>
    </div>
    <div class="row mt-10">
      <div class="col span-6">
        <LabelValue
          :name="t('tableHeaders.type')"
          :value="value.type"
        />
      </div>
      <div class="col span-6">
        <LabelValue
          :name="t('harvester.fields.macAddress')"
          :value="value.mac"
        />
      </div>
    </div>
    <div class="row mt-10">
      <div class="col span-6">
        <InputOrDisplay
          :name="t('harvester.fields.ipv4Address')"
          :value="value.ipv4Address"
          :mode="mode"
        >
          <template #value>
            <ul>
              <li v-for="a in value.ipv4Address" :key="a">
                {{ a }}
              </li>
            </ul>
          </template>
        </InputOrDisplay>
      </div>
      <div
        v-if="value.promiscuous === 'true'"
        class="col span-6"
      >
        <LabelValue
          :name="t('harvester.fields.promiscuous')"
          :value="value.promiscuous"
        >
          <template #value>
            {{ value.promiscuous === 'true' ? t('generic.yes') : t('generic.no') }}
          </template>
        </LabelValue>
      </div>
    </div>
  </div>
</template>
