<script>
import { clone, set } from '@shell/utils/object';
import { _VIEW } from '@shell/config/query-params';

import Mount from '@shell/edit/workload/storage/Mount';
import ButtonDropdown from '@shell/components/ButtonDropdown';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';

export default {
  name: 'ContainerMountPaths',

  emits: ['update:container'],

  components: {
    ArrayListGrouped, ButtonDropdown, Mount
  },

  props: {
    mode: {
      type:    String,
      default: 'create',
    },

    // pod spec
    value: {
      type:    Object,
      default: () => {
        return {};
      },
    },

    container: {
      type:    Object,
      default: () => {
        return {};
      },
    },
  },

  data() {
    // set volumeMount field
    this.initializeStorage();

    return { selectedContainerVolumes: this.getSelectedContainerVolumes() };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    availableVolumeOptions() {
      const containerVolumes = (this.container?.volumeMounts || []).map((item) => item.name);

      return (this.value?.volumes || []).filter((vol) => !containerVolumes.includes(vol.name)).map((item) => {
        return {
          label:  `${ item.name } (${ this.headerFor(item) })`,
          action: this.selectVolume,
          value:  item.name
        };
      });
    },
  },

  watch: {
    selectedContainerVolumes: {
      deep: true,
      handler(neu, old) {
        const names = neu.map((item) => item.name);

        this.container.volumeMounts = this.container.volumeMounts.filter((mount) => names.includes(mount.name));
      }
    }

  },

  methods: {
    /**
     * Initialize missing values for the container
     */
    initializeStorage() {
      if (!this.container.volumeMounts) {
        set(this.container, 'volumeMounts', []);
        this.$emit('update:container', this.container);
      }
    },

    getSelectedContainerVolumes() {
      // Extract volume mounts to map storage volumes
      const { volumeMounts = [] } = this.container;
      const names = volumeMounts.map(({ name }) => name);

      // Extract storage volumes to allow mutation, if matches mount map
      return clone((this.value?.volumes || []).filter((volume) => names.includes(volume.name)));
    },

    /**
     * Remove all mounts for given storage volume
     */
    removeVolume(volume) {
      const removeName = volume.row.value.name;

      this.selectedContainerVolumes = this.selectedContainerVolumes.filter(({ name }) => name !== removeName);
    },

    selectVolume(event) {
      const selectedVolume = (this.value?.volumes || []).find((vol) => vol.name === event.value);

      this.selectedContainerVolumes.push(selectedVolume);

      const { name } = selectedVolume;

      this.container.volumeMounts.push(name);
      this.$emit('update:container', this.container);
    },

    headerFor(value) {
      const type = Object.keys(value).filter(
        (key) => typeof value[key] === 'object'
      )[0];

      if (
        this.$store.getters['i18n/exists'](`workload.storage.subtypes.${ type }`)
      ) {
        return this.t(`workload.storage.subtypes.${ type }`);
      } else {
        return type;
      }
    },

  },
};
</script>

<template>
  <div>
    <!-- Storage Volumes -->
    <ArrayListGrouped
      :key="selectedContainerVolumes.length"
      v-model:value="selectedContainerVolumes"
      :add-allowed="false"
      :mode="mode"
      data-testid="container-storage-array-list"
      @remove="removeVolume"
    >
      <!-- Custom/default storage volume form -->
      <template #default="props">
        <h3>{{ props.row.value.name }} ({{ headerFor(props.row.value) }})</h3>
        <Mount
          :container="container"
          :name="props.row.value.name"
          :mode="mode"
          :data-testid="`container-storage-mount-${props.i}`"
        />
      </template>
    </ArrayListGrouped>
    <ButtonDropdown
      v-if="!isView"
      id="add-volume"
      :button-label="t('workload.storage.selectVolume')"
      :dropdown-options="availableVolumeOptions"
      size="sm"
      data-testid="container-storage-add-button"
      @click-action="e=>selectVolume(e)"
    >
      <template #no-options>
        {{ t('workload.storage.noVolumes') }}
      </template>
    </ButtonDropdown>
  </div>
</template>
