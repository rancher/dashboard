<script>
import ButtonDropdown from '@shell/components/ButtonDropdown';
import Mount from '@shell/pages/c/_cluster/logging/Mount.vue';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import { _VIEW } from '@shell/config/query-params';

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

    workload: {
      type:    Object,
      default: () => {
        return {};
      },
    },
    containers: {
      type:    Array,
      default: () => {
        return [];
      },
    },
  },

  data() {
    return {
      containerVolumes:   [],
      selectedContainers: this.getSelectedContainers()
    };
  },

  watch: {
    selectedContainers(neu, old) {
      const containerNames = neu.map(item => item.name);

      this.containers.forEach((container) => {
        if (!containerNames.includes(container.name)) {
          const namePrefix = `host-path-$namespace-$type-$workload`;
          const volumeMounts = container.volumeMounts || [];

          container.volumeMounts = volumeMounts.filter(mount => mount.name && !mount.name.startsWith(namePrefix));
        }
      });
    }
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    availableContainerOptions() {
      const selectedContainerNames = this.selectedContainers.map(({ name }) => name);

      return this.value.containers.filter(item => !selectedContainerNames.includes(item.name)).map((item) => {
        return {
          label:  item.name,
          action: this.selectContainer,
          value:  item.name
        };
      });
    },
  },

  methods: {
    initVolumeMounts() {
      const containers = this.containers;
      const { namespace, kind, nameDisplay } = this.workload;
      const type = kind.toLowerCase();

      containers.forEach((container) => {
        const volumeMounts = container.volumeMounts || [];
        const loggingMounts = [];
        const out = [];

        volumeMounts.forEach((mount) => {
          const namePrefix = `host-path-${ namespace }-${ type }-${ nameDisplay }`;

          if (mount.name && mount.name.startsWith(`${ namePrefix }`)) {
            if (mount.name && mount.name === `${ namePrefix }-file`) {
              const pos = mount.mountPath.lastIndexOf('\/');

              loggingMounts.push({
                name:      `host-path-$namespace-$type-$workload`,
                mountPath: mount.mountPath.substr(0, pos ),
                mountFile: mount.mountPath.substr(pos + 1 )
              });
            }
          } else {
            out.push(mount);
          }
        });

        out.push(...loggingMounts);

        this.$set(container, 'volumeMounts', out);
      });
    },

    getSelectedContainers() {
      const { containers = [] } = this.value;
      const { namespace, kind, nameDisplay } = this.workload;
      const type = kind.toLowerCase();
      const namePrefix = `host-path-${ namespace }-${ type }-${ nameDisplay }`;

      if (containers.length === 1) {
        return containers;
      }

      return containers.filter(container => container.volumeMounts && container.volumeMounts.length && container.volumeMounts.find(item => item.name === `${ namePrefix }-dir`));
    },

    removeContainerItem(container) {
      const removeName = container.row.value.name;

      this.selectedContainers = this.selectedContainers.filter(({ name }) => name !== removeName);
    },

    selectContainer(event) {
      const selectedContainer = this.value.containers.find(container => container.name === event.value);

      this.selectedContainers.push(selectedContainer);
    },
  },

  created() {
    this.initVolumeMounts();
  }
};
</script>

<template>
  <div>
    <ArrayListGrouped
      :key="selectedContainers.length"
      v-model="selectedContainers"
      :mode="mode"
      :namespace="workload.namespace"
      :kind="workload.kind"
      @remove="removeContainerItem"
    >
      <template #default="props">
        <h3>{{ props.row.value.name }}</h3>

        <Mount
          :container="props.row.value"
          :name="props.row.value.name"
          :namespace="props.row.value.namespace"
          :kind="props.row.value.kind"
          :mode="mode"
        />
      </template>

      <template #add>
        <ButtonDropdown
          v-if="!isView"
          id="add-volume"
          :button-label="t('logging.extension.storage.selectContainer')"
          :dropdown-options="availableContainerOptions"
          size="sm"
          @click-action="e=>selectContainer(e)"
        >
          <template #no-options>
            {{ t('workload.storage.noContainers') }}
          </template>
        </ButtonDropdown>
      </template>
    </ArrayListGrouped>
  </div>
</template>
