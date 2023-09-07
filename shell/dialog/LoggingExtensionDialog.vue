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
      const { namespace, kind, nameDisplay } = this.workload;
      const type = kind.toLowerCase();
      const namePrefix = `host-path-${ namespace }-${ type }-${ nameDisplay }`;

      this.value.volumes = [
        ...volumes.filter(item => !item.name.includes(namePrefix)),
        ...hosttailerVolumes,
      ];
    },
    updateVolumeMounts(containers) {
      containers.forEach((container) => {
        if (container.volumeMounts && container.volumeMounts.length) {
          const volumeMountFiles = [];

          container.volumeMounts.map((mount) => {
            if (mount.name && mount.name.startsWith('host-path-$namespace-$type-$workload')) {
              const namespace = this.workload.namespace;
              const type = this.workload.kind.toLowerCase();
              const workloadName = this.workload.nameDisplay;

              const name = mount.name.replace('host-path-$namespace-$type-$workload', `host-path-${ namespace }-${ type }-${ workloadName }`);

              mount.name = `${ name }-dir`;

              if (mount.mountFile) {
                const filePath = this.getMountFilePath(mount);

                volumeMountFiles.push({
                  mountPath: filePath,
                  name:      `${ name }-file`
                });

                delete mount.mountFile;
              }
            }

            return mount;
          });

          // Add Container-File path to container volumeMounts
          if (volumeMountFiles.length) {
            container.volumeMounts.push(...volumeMountFiles);
          }
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
        const name = 'host-path-$namespace-$type-$workload';

        volumeMounts.forEach((mount) => {
          if (mount.name === name) {
            if (!mount.mountPath) {
              errors.push(this.t('validation.required', { key: this.t('logging.extension.storage.mountPath') }));
            }

            if (!mount.mountFile) {
              errors.push(this.t('validation.required', { key: this.t('logging.extension.storage.mountFile') }));
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
      const { namespace, kind, nameDisplay } = this.workload;
      const type = kind.toLowerCase();
      const out = [];

      containers.forEach((container) => {
        const volumeMounts = container.volumeMounts || [];

        if (!out.length && volumeMounts.find(item => item.name === `host-path-${ namespace }-${ type }-${ nameDisplay }-dir`)) {
          out.push(...[{
            _type:    'hostPath',
            hostPath: {
              type: 'FileOrCreate',
              path: `/var/log/hosttailer/${ namespace }/${ type }/${ nameDisplay }.log`
            },
            name: `host-path-${ namespace }-${ type }-${ nameDisplay }-file`
          }, {
            _type:    'hostPath',
            hostPath: {
              type: 'DirectoryOrCreate',
              path: `/var/log/hosttailer/${ namespace }/${ type }`
            },
            name: `host-path-${ namespace }-${ type }-${ nameDisplay }-dir`
          }]);
        }
      });

      return out;
    },

    async updateOrCreateHostTailer(hosttailerVolumes) {
      const {
        namespace, kind, nameDisplay, apiVersion
      } = this.workload;
      const type = kind.toLowerCase();
      const name = `${ namespace }-${ type }-${ nameDisplay }`;
      const hosttailers = await this.$store.dispatch('cluster/findAll', { type: LOGGING.HOST_TAILER });
      const hosttailer = hosttailers.find(hosttailer => hosttailer.metadata.name === `file-hosttailer-${ name }`);
      const isCreate = !hosttailer;
      const headers = {
        'content-type': 'application/yaml',
        accept:         'application/json'
      };
      let data = {};

      const fileTailers = hosttailerVolumes.filter(v => v.name && v.name.endsWith('-file')).map((volume) => {
        const path = volume.hostPath.path;
        const volumeName = volume.name.replace('host-path-', '');

        return {
          name:     `${ volumeName }-logfile`,
          path,
          disabled: false
        };
      });

      if (!fileTailers.length) {
        if (!isCreate) {
          this.hosttailerSchema.followLink('remove', {
            url:    hosttailer.links.remove,
            method: 'DELETE',
            headers,
          });
        }

        return;
      }

      if (!isCreate) {
        data = hosttailer;
        data.spec.fileTailers = fileTailers;
      } else {
        data = {
          apiVersion: 'logging-extensions.banzaicloud.io/v1alpha1',
          kind:       'HostTailer',
          metadata:   {
            name:            `file-hosttailer-${ name }`,
            namespace,
            ownerReferences: [
              {
                apiVersion,
                kind,
                uid:  this.workload.metadata.uid,
                name: this.workload.metadata.name,
              }
            ]
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
