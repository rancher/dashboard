<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { Checkbox } from '@components/Form/Checkbox';
import { Banner } from '@components/Banner';
import { _CREATE } from '@shell/config/query-params';
import {
  DISK_CACHE_MODES, DISK_IO_MODES, PROFILE, Disk, applyPerformanceOptions, detectProfile, hasPerformanceOptions, requestCustomProfile
} from './storage-options';

const props = withDefaults(defineProps<{
  value: Disk;
  mode?: string;
  disabled?: boolean;
}>(), { mode: _CREATE, disabled: false });

const emit = defineEmits<{(e: 'update:value', value: Disk): void }>();

const store = useStore();
const { t } = useI18n(store);

const profile = computed(() => detectProfile(props.value));

// The driver rejects storage options on a CD-ROM
const isCdRom = computed(() => props.value.type === 'cd-rom');

const isCustom = computed(() => profile.value === PROFILE.CUSTOM);

const isHighPerformance = computed(() => profile.value === PROFILE.HIGH);

// The driver defaults an unset bus to virtio. KubeVirt rejects a dedicated I/O thread on any other bus.
const isVirtio = computed(() => !props.value.bus || props.value.bus === 'virtio');

// Only worth pointing out once the disk uses an option, as Harvester does
const showBusWarning = computed(() => !isVirtio.value && hasPerformanceOptions(props.value));

const profileOptions = computed(() => Object.values(PROFILE).map((value) => ({
  label:    t(`cluster.credential.harvester.storageOptions.profile.${ value }`),
  value,
  disabled: value === PROFILE.HIGH && !isVirtio.value,
})));

const cacheOptions = computed(() => DISK_CACHE_MODES.map((value) => ({
  label:    t(`cluster.credential.harvester.storageOptions.cache.${ value || 'default' }`),
  value,
  disabled: props.value.io === 'native' && value !== 'none',
})));

const ioOptions = computed(() => DISK_IO_MODES.map((value) => ({
  label: t(`cluster.credential.harvester.storageOptions.io.${ value || 'default' }`),
  value,
})));

function set(options: Disk) {
  emit('update:value', applyPerformanceOptions(props.value, options));
}

function setProfile(profile: string) {
  requestCustomProfile(props.value, profile === PROFILE.CUSTOM);

  if (profile === PROFILE.DEFAULT) {
    set({
      cache: '', io: '', dedicatedIOThread: false
    });
  } else if (profile === PROFILE.HIGH) {
    set({
      cache: 'none', io: 'native', dedicatedIOThread: true
    });
  }
}
</script>

<template>
  <div v-if="!isCdRom">
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledSelect
          :value="profile"
          data-testid="disk-storage-options-profile"
          :label="t('cluster.credential.harvester.storageOptions.profile.label')"
          :tooltip="t('cluster.credential.harvester.storageOptions.profile.tip')"
          :options="profileOptions"
          :mode="mode"
          :disabled="disabled"
          @update:value="setProfile"
        />
      </div>
    </div>

    <Banner
      v-if="isHighPerformance"
      color="info"
      :label="t('cluster.credential.harvester.storageOptions.highPerformanceTip')"
    />

    <Banner
      v-if="showBusWarning"
      color="warning"
      data-testid="disk-storage-options-bus-warning"
      :label="t('cluster.credential.harvester.storageOptions.busWarning', { bus: value.bus })"
    />

    <template v-if="isCustom">
      <div class="row mb-10">
        <div class="col span-6">
          <LabeledSelect
            :value="value.cache || ''"
            data-testid="disk-storage-options-cache"
            :label="t('cluster.credential.harvester.storageOptions.cache.label')"
            :tooltip="t('cluster.credential.harvester.storageOptions.cache.tip')"
            :options="cacheOptions"
            :mode="mode"
            :disabled="disabled"
            @update:value="set({ cache: $event })"
          />
        </div>
        <div class="col span-6">
          <LabeledSelect
            :value="value.io || ''"
            data-testid="disk-storage-options-io"
            :label="t('cluster.credential.harvester.storageOptions.io.label')"
            :tooltip="t('cluster.credential.harvester.storageOptions.io.tip')"
            :options="ioOptions"
            :mode="mode"
            :disabled="disabled"
            @update:value="set({ io: $event })"
          />
        </div>
      </div>

      <Checkbox
        :value="!!value.dedicatedIOThread"
        data-testid="disk-storage-options-dedicated-iothread"
        class="mb-10"
        :label="t('cluster.credential.harvester.storageOptions.dedicatedIOThread.label')"
        :tooltip="t('cluster.credential.harvester.storageOptions.dedicatedIOThread.tip')"
        :mode="mode"
        :disabled="disabled || (!isVirtio && !value.dedicatedIOThread)"
        @update:value="set({ dedicatedIOThread: $event })"
      />

      <!-- Always rendered, so screen readers announce the tip when picking native I/O changes the cache mode -->
      <div
        role="status"
        data-testid="disk-storage-options-native-status"
      >
        <Banner
          v-if="value.io === 'native'"
          color="info"
          :label="t('cluster.credential.harvester.storageOptions.io.nativeTip')"
        />
      </div>
    </template>
  </div>
</template>
