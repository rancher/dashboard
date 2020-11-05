<script>
import ArrayList from '@/components/form/ArrayList';
import InfoBox from '@/components/InfoBox';

export default { components: { ArrayList, InfoBox } };
</script>
<template>
  <ArrayList class="array-list-grouped" v-bind="$attrs" @input="$emit('input', $event)">
    <template v-slot:columns="scope">
      <InfoBox>
        <slot v-bind="scope"></slot>
      </InfoBox>
    </template>
    <template v-slot:remove-button="scope">
      <button class="btn role-link close" @click="scope.remove">
        <i class="icon icon-2x icon-x" />
      </button>
    </template>
  </ArrayList>
</template>
<style lang="scss">
.array-list-grouped {
    .box {
      position: relative;
    }

    .remove {
      position: absolute;

      padding: 0px;

      top: 0;
      right: 0;
    }

    .info-box {
        margin-bottom: 0;
    }
}
</style>
