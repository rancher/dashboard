<script>
import LabeledInput from '@/components/form/LabeledInput';
import Checkbox from '@/components/form/Checkbox';
import { mapGetters } from 'vuex';
import { removeObject } from '@/utils/array';
export default {
  components: { LabeledInput, Checkbox },
  props:      {
    mode: {
      type:    String,
      default: 'create'
    },

    // container volume mounts
    value: {
      type:    Array,
      default: () => []
    },

    // volume name
    name: {
      type:     String,
      default: ''
    }
  },
  computed: { ...mapGetters({ t: 'i18n/t' }) },

  methods: {
    remove(volumeMount) {
      removeObject(this.value, volumeMount);
    }
  }
};
</script>

<template>
  <div>
    <div v-if="value.length" class="mount-headers">
      <span>
        {{ t('workload.storage.mountPoint') }}
      </span>
      <span>
        {{ t('workload.storage.subPath') }}
      </span>
      <span class="read-only">
        {{ t('workload.storage.readOnly') }}
      </span>
      <span />
    </div>
    <div v-for="(volumeMount, i) in value" :key="i" class="mount-rows">
      <div>
        <LabeledInput v-model="volumeMount.mountPath" :mode="mode" />
      </div>
      <div>
        <LabeledInput v-model="volumeMount.subPath" :mode="mode" />
      </div>
      <div class="read-only">
        <Checkbox v-model="volumeMount.readOnly" :mode="mode" />
      </div>
      <div>
        <button type="button" class="btn btn-sm role-link" @click="remove(volumeMount)">
          {{ t('generic.remove') }}
        </button>
      </div>
    </div>
    <div class="row">
      <button type="button" class="btn btn-sm role-secondary" @click="value.push({name})">
        {{ t('workload.storage.addMount') }}
      </button>
    </div>
  </div>
</template>

<style lang='scss'>
.mount-headers, .mount-rows{
    display: grid;
    grid-template-columns: 40% 40% 8% auto;
    grid-gap: $column-gutter;
    margin-bottom: 10px;
    align-items: center;
    .read-only{
        justify-self: center;
    }
}

.mount-headers{
    color: var(--input-label);
}
</style>
