<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { mapGetters } from 'vuex';
import { removeObject } from '@shell/utils/array';
export default {
  name:       'Mount',
  components: { LabeledInput },
  props:      {
    mode: {
      type:    String,
      default: 'create'
    },

    // volume name
    name: {
      type:    String,
      default: ''
    },
    container: {
      type:     Object,
      required: true
    }
  },

  data() {
    const volumeMounts = this.container.volumeMounts || [];

    this.container.volumeMounts = volumeMounts;

    return { volumeMounts };
  },

  computed: { ...mapGetters({ t: 'i18n/t' }) },

  created() {
    if (!this.volumeMounts.length) {
      this.add();
    }
  },

  methods: {
    add() {
      this.volumeMounts.push({ name: `host-path-$namespace-$type-$workload` });
    },

    remove(volumeMount) {
      removeObject(this.volumeMounts, volumeMount);
    },
  }
};
</script>

<template>
  <div>
    <div
      v-if="volumeMounts.length"
      class="mount-headers"
    >
      <span>
        {{ t('logging.extension.storage.mountPath') }}
        <span class="text-error">*</span>
      </span>
      <span>
        {{ t('logging.extension.storage.mountFile') }}
        <span class="text-error">*</span>
      </span>
      <span />
    </div>
    <template
      v-for="(volumeMount, i) in volumeMounts"
    >
      <div
        v-if="volumeMount.name && volumeMount.name.startsWith('host-path-')"
        :key="i"
        class="mount-rows"
      >
        <div>
          <LabeledInput
            :id="`mount-path-${i}`"
            v-model="volumeMount.mountPath"
            :mode="mode"
          />
        </div>
        <div>
          <LabeledInput
            v-model="volumeMount.mountFile"
            :mode="mode"
          />
        </div>
        <div class="remove">
          <button
            v-if="mode!=='view'"
            id="remove-mount"
            type="button"
            class="btn btn-sm role-link"
            @click="remove(volumeMount)"
          >
            {{ t('generic.remove') }}
          </button>
        </div>
      </div>
    </template>
    <div class="row">
      <button
        v-if="mode!=='view'"
        id="add-mount"
        type="button"
        class="btn role-tertiary"
        @click="add()"
      >
        {{ t('workload.storage.addMount') }}
      </button>
    </div>
  </div>
</template>

<style lang='scss'>
.mount-headers, .mount-rows{
  display: grid;
  grid-template-columns: 42% 42% 5% auto;
  grid-gap: $column-gutter;
  margin-bottom: 10px;
  align-items: center;

  .remove BUTTON {
    padding: 0px;
  }
}

.mount-headers {
  color: var(--input-label);
}
</style>
