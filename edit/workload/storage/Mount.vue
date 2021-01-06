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
    },

    podSpec: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  data() {
    const container = this.podSpec.containers[0];

    const volumeMounts = (container.volumeMounts || []).filter(mount => mount.name === this.name);

    return { volumeMounts };
  },

  computed: {
    type() {
      return Object.keys(this.value).filter(key => key !== 'name')[0];
    },

    ...mapGetters({ t: 'i18n/t' })
  },

  watch: {
    volumeMounts(neu) {
      const container = this.podSpec.containers[0];

      container.volumeMounts = (container.volumeMounts || []).filter(mount => mount.name && (mount.name !== this.name));
      container.volumeMounts.push(...neu);
    },

    name(neu) {
      this.updateMountNames(neu);
    }
  },

  created() {
    if (!this.volumeMounts.length) {
      this.volumeMounts.push({ name: this.name });
    }
  },

  methods: {
    remove(volumeMount) {
      removeObject(this.volumeMounts, volumeMount);
    },

    updateMountNames(name) {
      this.volumeMounts.forEach((mount) => {
        mount.name = name;
      });
    }
  }
};
</script>

<template>
  <div>
    <div v-if="volumeMounts.length" class="mount-headers">
      <span>
        {{ t('workload.storage.mountPoint') }}<span class="text-error">*</span>
      </span>
      <span>
        {{ t('workload.storage.subPath') }}
      </span>
      <span class="read-only">
        {{ t('workload.storage.readOnly') }}
      </span>
      <span />
    </div>
    <div v-for="(volumeMount, i) in volumeMounts" :key="i" class="mount-rows">
      <div>
        <LabeledInput v-model="volumeMount.mountPath" :mode="mode" />
      </div>
      <div>
        <LabeledInput v-model="volumeMount.subPath" :mode="mode" />
      </div>
      <div class="read-only">
        <Checkbox v-model="volumeMount.readOnly" :mode="mode" />
      </div>
      <div class="remove">
        <button v-if="mode!=='view'" type="button" class="btn btn-sm role-link" @click="remove(volumeMount)">
          {{ t('generic.remove') }}
        </button>
      </div>
    </div>
    <div class="row">
      <button v-if="mode!=='view'" type="button" class="btn btn-sm role-tertiary" @click="volumeMounts.push({name})">
        {{ t('workload.storage.addMount') }}
      </button>
    </div>
  </div>
</template>

<style lang='scss'>
.mount-headers, .mount-rows{
    display: grid;
    grid-template-columns: 35% 35% auto auto;
    grid-gap: $column-gutter;
    margin-bottom: 10px;
    align-items: center;

    .remove {
      text-align: right;
    }
}

.mount-headers{
    color: var(--input-label);
}
</style>
