<script>
import AsyncButton from '@shell/components/AsyncButton';
import { LabeledInput } from '@components/Form/LabeledInput';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import { UI_PLUGIN } from '@shell/config/types';
import { UI_PLUGIN_NAMESPACE } from '@shell/config/uiplugins';

export default {
  components: {
    AsyncButton,
    Checkbox,
    LabeledInput,
  },

  data() {
    return {
      name:              '',
      location:          '',
      persist:           false,
      canModifyName:     true,
      canModifyLocation: true,
    };
  },

  watch: {
    name(neu, old) {
      if (this.canModifyLocation) {
        this.location = `/pkg/${ neu }/${ neu }.umd.min.js`;
      }
    },
    location(neu, old) {
      if (this.canModifyName) {
        const names = neu.split('/');
        let last = names[names.length - 1];
        let index = last.indexOf('.umd.min.js');

        if (index !== -1) {
          last = last.substr(0, index);
        } else {
          index = last.indexOf('.umd.js');
          if (index !== -1) {
            last = last.substr(0, index);
          }
        }

        this.name = last;
      }
    }
  },

  methods: {
    showDialog() {
      this.$modal.show('developerInstallPluginDialog');
    },
    closeDialog(result) {
      this.$modal.hide('developerInstallPluginDialog');
      this.$emit('closed', result);
    },

    updateName(v) {
      this.canModifyName = v.length === 0;
    },

    updateLocation(v) {
      this.canModifyLocation = v.length === 0;
    },

    async loadPlugin(btnCb) {
      let name = this.name;
      const url = this.location;

      if (!name) {
        const parts = url.split('/');
        const n = parts[parts.length - 1];

        // Split on '.'
        name = n.split('.')[0];
      }

      // Try and parse version number from the name
      let version = '0.0.1';
      let crdName = name;

      const parts = name.split('-');

      if (parts.length === 2) {
        crdName = parts[0];
        version = parts[1];
      }

      if (this.persist) {
        const pluginCR = await this.$store.dispatch('management/create', {
          type:     UI_PLUGIN,
          metadata: {
            name,
            namespace: UI_PLUGIN_NAMESPACE
          },
          spec:     {
            plugin: {
              name:     crdName,
              version,
              endpoint: url,
              noCache:  true,
              metadata: {
                developer: 'true',
                direct:    'true'
              }
            }
          }
        });

        try {
          await pluginCR.save({ url: `/v1/${ UI_PLUGIN }`, method: 'POST' });
        } catch (e) {
          console.error('Could not create CRD for plugin', e); // eslint-disable-line no-console
          btnCb(false);
        }
      }

      this.$plugin.loadAsync(name, url).then(() => {
        this.closeDialog(true);
        this.$store.dispatch('growl/success', {
          title:   this.t('plugins.success.title', { name }),
          message: this.t('plugins.success.message'),
          timeout: 3000,
        }, { root: true });
        btnCb(true);
      }).catch((error) => {
        btnCb(false);
        // this.closeDialog(false);
        const message = typeof error === 'object' ? this.t('plugins.error.message') : error;

        this.$store.dispatch('growl/error', {
          title:   this.t('plugins.error.title'),
          message,
          timeout: 5000
        }, { root: true });
      });
    }
  }
};
</script>

<template>
  <modal
    name="developerInstallPluginDialog"
    height="auto"
    :scrollable="true"
  >
    <div class="plugin-install-dialog">
      <h4>
        {{ t('plugins.developer.title') }}
      </h4>
      <p>
        {{ t('plugins.developer.prompt') }}
      </p>
      <div class="custom mt-10">
        <div class="fields">
          <LabeledInput v-model="location" v-focus label-key="plugins.developer.fields.url" @input="updateLocation" />
        </div>
      </div>
      <div class="custom mt-10">
        <div class="fields">
          <LabeledInput v-model="name" label-key="plugins.developer.fields.name" @input="updateName" />
        </div>
        <div class="fields mt-10">
          <Checkbox v-model="persist" label-key="plugins.developer.fields.persist" />
        </div>
        <div class="dialog-buttons mt-20">
          <button class="btn role-secondary" @click="closeDialog()">
            {{ t('generic.cancel') }}
          </button>
          <AsyncButton
            mode="load"
            @click="loadPlugin"
          />
        </div>
      </div>
    </div>
  </modal>
</template>

<style lang="scss" scoped>
  .plugin-install-dialog {
    padding: 10px;

    h4 {
      font-weight: bold;
    }

    .dialog-panel {
      display: flex;
      flex-direction: column;
      min-height: 100px;

      p {
        margin-bottom: 5px;
      }

      .dialog-info {
        flex: 1;
      }

      .toggle-advanced {
        display: flex;
        align-items: center;
        cursor: pointer;
        margin: 10px 0;

        &:hover {
          text-decoration: none;
          color: var(--link);
        }
      }

      .version-selector {
        margin: 0 10px 10px 10px;
        width: auto;
      }
    }

    .dialog-buttons {
      display: flex;
      justify-content: flex-end;
      margin-top: 10px;

      > *:not(:last-child) {
        margin-right: 10px;
      }
    }
  }
</style>
