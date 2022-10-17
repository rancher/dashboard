<script>
import { PVC } from '@shell/config/types';
import ButtonDropdown from '@shell/components/ButtonDropdown';
import Mount from '@shell/edit/workload/storage/Mount';
import { _VIEW } from '@shell/config/query-params';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import { randomStr } from '@shell/utils/string';

export default {
  name:       'ContainerMountPaths',
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
      type:     Object,
      default: () => {
        return {};
      },
    },
  },

  async fetch() {
    if ( this.$store.getters['cluster/schemaFor'](PVC) ) {
      this.pvcs = await this.$store.dispatch('cluster/findAll', { type: PVC });
    } else {
      this.pvcs = [];
    }
  },

  data() {
    this.initializeStorage();

    return {
      containerVolumes:         [],
      pvcs:                     [],
      storageVolumes:           this.getStorageVolumes(),
      selectedContainerVolumes: this.getSelectedContainerVolumes()
    };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    availableVolumeOptions() {
      const containerVolumes = this.container.volumeMounts.map(item => item.name);

      return this.value.volumes.filter(vol => !containerVolumes.includes(vol.name)).map((item) => {
        return {
          label:  `${ item.name } (${ this.headerFor(item) })`,
          action: this.selectVolume,
          value:  item.name
        };
      });
    },
  },

  watch: {
    value(neu, old) {
      this.selectedVolumes = this.getSelectedContainerVolumes();
    },
    storageVolumes(neu, old) {
      // removeObjects(this.value.volumes, old);
      // addObjects(this.value.volumes, neu);
      const names = neu.reduce((all, each) => {
        all.push(each.name);

        return all;
      }, []);

      this.container.volumeMounts = this.container.volumeMounts.filter(mount => names.includes(mount.name));
    },

    selectedContainerVolumes(neu, old) {
      // removeObjects(this.value.volumes, old);
      // addObjects(this.value.volumes, neu);
      const names = neu.map(item => item.name);

      this.container.volumeMounts = this.container.volumeMounts.filter(mount => names.includes(mount.name));
    }

  },

  methods: {
    /**
     * Initialize missing values for the container
     */
    initializeStorage() {
      if (!this.container.volumeMounts) {
        this.$set(this.container, 'volumeMounts', []);
      }
      if (!this.value.volumes) {
        this.$set(this.value, 'volumes', []);
      }
    },

    /**
     * Get existing paired storage volumes
     */
    getStorageVolumes() {
      // Extract volume mounts to map storage volumes
      const { volumeMounts = [] } = this.container;
      const names = volumeMounts.map(({ name }) => name);

      // Extract storage volumes to allow mutation, if matches mount map
      return this.value.volumes.filter(volume => names.includes(volume.name));
    },

    getSelectedContainerVolumes() {
      // Extract volume mounts to map storage volumes
      const { volumeMounts = [] } = this.container;
      const names = volumeMounts.map(({ name }) => name);

      // Extract storage volumes to allow mutation, if matches mount map
      return this.value.volumes.filter(volume => names.includes(volume.name));
    },

    /**
     * Remove all mounts for given storage volume
     */
    removeVolume(volume) {
      const removeName = volume.row.value.name;

      this.selectedContainerVolumes = this.selectedContainerVolumes.filter(({ name }) => name !== removeName);
    },

    selectVolume(event) {
      const selectedVolume = this.value.volumes.find(vol => vol.name === event.value);

      this.selectedContainerVolumes.push(selectedVolume);

      const { name } = selectedVolume;

      this.container.volumeMounts.push(name);
    },

    addVolume(type) {
      const name = `vol-${ randomStr(5).toLowerCase() }`;

      if (type === 'createPVC') {
        this.storageVolumes.push({
          _type:                 'createPVC',
          persistentVolumeClaim: {},
          name,
        });
      } else if (type === 'csi') {
        this.storageVolumes.push({
          _type: type,
          csi:   { volumeAttributes: {} },
          name,
        });
      } else {
        this.storageVolumes.push({
          _type:  type,
          [type]: {},
          name,
        });
      }

      this.container.volumeMounts.push({ name });
    },

    headerFor(value) {
      const type = Object.keys(value).filter(
        key => typeof value[key] === 'object'
      )[0];

      if (
        this.$store.getters['i18n/exists'](`workload.storage.subtypes.${ type }`)
      ) {
        return this.t(`workload.storage.subtypes.${ type }`);
      } else {
        return type;
      }
    },

    openPopover() {
      const button = this.$refs.buttonDropdown;

      try {
        button.togglePopover();
      } catch (e) {}
    },
  },
};
</script>

<template>
  <div>
    <!-- Storage Volumes -->
    <ArrayListGrouped
      :key="selectedContainerVolumes.length"
      v-model="selectedContainerVolumes"
      :mode="mode"
      @remove="removeVolume"
    >
      <!-- Custom/default storage volume form -->
      <template #default="props">
        <h3>{{ props.row.value.name }} ({{ headerFor(props.row.value) }})</h3>
        <Mount
          :container="container"
          :name="props.row.value.name"
          :mode="mode"
        />
      </template>

      <!-- Add Storage Volume -->
      <template #add>
        <ButtonDropdown
          v-if="!isView"
          id="add-volume"
          :button-label="t('workload.storage.selectVolume')"
          :dropdown-options="availableVolumeOptions"
          size="sm"
          @click-action="e=>selectVolume(e)"
        >
          <template #no-options>
            {{ t('workload.storage.noVolumes') }}
          </template>
        </ButtonDropdown>
      </template>
    </ArrayListGrouped>
  </div>
</template>
