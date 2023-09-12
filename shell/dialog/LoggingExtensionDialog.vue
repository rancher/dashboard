<script>
import { exceptionToErrorsArray } from '@shell/utils/error';
import { mapGetters } from 'vuex';
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import AsyncButton from '@shell/components/AsyncButton';
import { LOGGING } from '@shell/config/types';
import ContainerMountPaths from '@shell/pages/c/_cluster/logging/ContainerMountPaths.vue';
import jsyaml from 'js-yaml';
import { clone } from '@shell/utils/object';

const TYPES = {
  DaemonSet:   'ds',
  CronJob:     'cj',
  Deployment:  'deploy',
  Job:         'job',
  StatefulSet: 'sts',
};

export default {
  components: {
    AsyncButton, Card, Banner, ContainerMountPaths
  },
  props: {
    resources: {
      type:     Array,
      required: true
    },
    workloadId: {
      type:     String,
      required: true
    },
    workloadType: {
      type:     String,
      required: true
    },
  },
  data() {
    return { errors: [] };
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    workload() {
      return this.$store.getters['cluster/byId'](this.workloadType, this.workloadId);
    },
    value() {
      return clone(this.workload?.spec?.template?.spec || {});
    },
    hosttailerSchema() {
      return this.$store.getters['cluster/schemaFor'](LOGGING.HOST_TAILER);
    },
    uid() {
      return this.workload?.metadata?.uid;
    }
  },
  methods: {
    close() {
      this.$emit('close');
    },
    getMountFilePath(mount) {
      let dir = mount.mountPath;
      let file = mount.mountFile;

      if (mount.mountPath && mount.mountPath.endsWith('/')) {
        dir = mount.mountPath.substr(0, mount.mountPath.length - 1);
      }

      if (mount.mountFile && mount.mountFile.startsWith('/')) {
        file = mount.mountFile.substr(1, mount.mountFile.length);
      }

      return `${ dir }/${ file }`;
    },
    updateVolumes(hosttailerVolumes) {
      const { volumes = [] } = this.value;
      const namePrefix = `host-path-${ this.uid }`;

      this.value.volumes = [
        ...volumes.filter((item) => !item.name.includes(namePrefix)),
        ...hosttailerVolumes,
      ];
    },
    updateVolumeMounts(containers) {
      containers.forEach((container) => {
        if (container.volumeMounts && container.volumeMounts.length) {
          container.volumeMounts.map((mount) => {
            if (mount.name && mount.name.startsWith('host-path-$uid')) {
              const name = mount.name.replace('host-path-$uid', `host-path-${ this.uid }`);

              mount.name = `${ name }-${ container.name }`;
            }

            return mount;
          });
        }
      });
    },
    updateWorkload(containers) {
      this.workload.spec.template.spec = this.value;
      this.workload.spec.template.spec.containers = containers;
    },
    validation() {
      const errors = [];
      const containers = this.value.containers || [];

      containers.forEach((container) => {
        const volumeMounts = container.volumeMounts || [];
        const name = 'host-path-$uid';

        volumeMounts.forEach((mount) => {
          if (mount.name === name) {
            if (!mount.mountPath) {
              errors.push(this.t('validation.required', { key: this.t('logging.extension.storage.mountPath') }));
            }
          }
        });
      });

      return errors;
    },
    save(buttonCb) {
      const containers = clone(this.value.containers);
      const errors = this.validation();

      if (errors.length) {
        this.$set(this, 'errors', errors);
        buttonCb(false);

        return;
      }

      this.updateVolumeMounts(containers);

      const hosttailerVolumes = this.getHosttailerVolumesByVolumeMounts(containers);

      this.updateVolumes(hosttailerVolumes);
      this.updateWorkload(containers);
      try {
        const workload = this.workload;

        workload.save().then((res) => {
          this.close();
          buttonCb(true);
          this.updateOrCreateHostTailer(hosttailerVolumes);
        }).catch((err) => {
          const error = err?.data || err;
          const message = exceptionToErrorsArray(error);

          this.$set(this, 'errors', message);
          buttonCb(false);
        });
      } catch (err) {
        const error = err?.data || err;
        const message = exceptionToErrorsArray(error);

        this.$set(this, 'errors', message);
        buttonCb(false);
      }
    },

    getHosttailerVolumesByVolumeMounts(containers) {
      const uid = this.uid;
      const out = [];

      containers.forEach((container) => {
        const volumeMounts = container.volumeMounts || [];

        if (volumeMounts.find((item) => item.name === `host-path-${ uid }-${ container.name }`)) {
          out.push(...[{
            _type:    'hostPath',
            hostPath: {
              type: 'DirectoryOrCreate',
              path: `/var/log/hosttailer/${ uid }`
            },
            name: `host-path-${ uid }-${ container.name }`
          }]);
        }
      });

      return out;
    },

    async updateOrCreateHostTailer(hosttailerVolumes) {
      const hosttailers = await this.$store.dispatch('cluster/findAll', { type: LOGGING.HOST_TAILER });
      const hosttailer = hosttailers.find((hosttailer) => hosttailer.id === 'cattle-logging-system/file-hosttailer');
      const isCreate = !hosttailer;
      const headers = {
        'content-type': 'application/yaml',
        accept:         'application/json'
      };
      const { namespace, kind, nameDisplay } = this.workload;
      const namePrefix = `${ namespace }-${ TYPES[kind] }-${ nameDisplay }`;

      let data = {};

      const fileTailersAll = hosttailer?.spec?.fileTailers || [];
      const fileTailers = fileTailersAll.filter((fileTailer) => !fileTailer.name.startsWith(namePrefix));

      hosttailerVolumes.forEach((volume) => {
        const path = `${ volume.hostPath.path }/*`;
        const volumeName = namePrefix + volume.name.replace(`host-path-${ this.uid }`, '');

        fileTailers.push({
          name:     volumeName,
          path,
          disabled: false
        }) ;
      });

      if (!isCreate) {
        data = hosttailer;
        data.spec.fileTailers = fileTailers;
      } else {
        data = {
          apiVersion: 'logging-extensions.banzaicloud.io/v1alpha1',
          kind:       'HostTailer',
          metadata:   {
            name:      `file-hosttailer`,
            namespace: 'cattle-logging-system',
          },
          spec: { fileTailers }
        };
      }

      if ( isCreate ) {
        this.hosttailerSchema.followLink('collection', {
          method: 'POST',
          headers,
          data:   jsyaml.dump(data),
        });
      } else {
        this.hosttailerSchema.followLink('update', {
          url:    hosttailer.links.update,
          method: 'PUT',
          headers,
          data:   jsyaml.dump(data),
        });
      }
    },
  }
};
</script>
<template>
  <Card
    ref="modal"
    name="modal"
    :show-highlight-border="false"
  >
    <h4
      slot="title"
      v-clean-html="t('logging.extension.storage.title')"
      class="text-default-text"
    />
    <template #body>
      <ContainerMountPaths
        v-model="value"
        mode="edit"
        :containers="value.containers"
        :workload="workload"
      />
    </template>
    <div
      slot="actions"
      class="actions"
    >
      <Banner
        v-for="(err, i) in errors"
        :key="i"
        color="error"
        :label="err"
      />
      <div class="buttons">
        <button
          type="button"
          class="btn role-secondary mr-10"
          @click="close"
        >
          {{ t('generic.cancel') }}
        </button>
        <AsyncButton
          mode="edit"
          @click="save"
        />
      </div>
    </div>
  </Card>
</template>
<style lang="scss" scoped>
.actions {
  width: 100%;
}
.buttons {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}
</style>
