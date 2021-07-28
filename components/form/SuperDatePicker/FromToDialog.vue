<script>
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';
import Absolute from '@/components/form/SuperDatePicker/Absolute';
import Relative from '@/components/form/SuperDatePicker/Relative';
import Now from '@/components/form/SuperDatePicker/Now';

export default {
  components: {
    Absolute,
    Relative,
    Now,
    Tab,
    Tabbed,
  },

  props: {
    value: {
      type:     Object,
      required: true
    },
  },
};
</script>

<template>
  <div slot="body" class="dialog">
    <Tabbed :horizontal-tabs="false">
      <Tab name="absolute" label="Absolute" :weight="2">
        <template #default="props">
          <Absolute v-if="props.active" v-model="value" />
        </template>
      </Tab>
      <Tab name="relative" label="Relative" :weight="1">
        <template #default="props">
          <Relative v-if="props.active" v-model="value" />
        </template>
      </Tab>
      <Tab name="now" label="Now" :weight="0">
        <template #default="props">
          <Now v-if="props.active" v-model="value" />
        </template>
      </Tab>
    </Tabbed>
  </div>
</template>

<style lang="scss" scoped>
::v-deep {
  .tab-container {
    width: 375px;
  }
}
</style>
