<script>
import { mapGetters } from 'vuex';
import isEmpty from 'lodash/isEmpty';

import { CATALOG, SECRET, SERVICE, WORKLOAD_TYPES } from '@shell/config/types';
import { UI_PLUGIN_LABELS, UI_PLUGIN_NAMESPACE } from '@shell/config/uiplugins';
import { TYPES as SECRET_TYPES } from '@shell/models/secret';
import { allHash } from '@shell/utils/promise';

import ResourceManager from '@shell/mixins/resource-manager';

import AsyncButton from '@shell/components/AsyncButton';
import AppModal from '@shell/components/AppModal';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Loading from '@shell/components/Loading.vue';
import { Banner } from '@components/Banner';
import { LabeledInput } from '@components/Form/LabeledInput';

const DEFAULT_DEPLOYMENT = {
  type:     WORKLOAD_TYPES.DEPLOYMENT,
  metadata: {
    name:      '',
    namespace: UI_PLUGIN_NAMESPACE,
    labels:    {}
  },
  spec: {
    replicas: 1,
    selector: { matchLabels: {} },
    template: {
      metadata: {
        namespace: UI_PLUGIN_NAMESPACE,
        labels:    {}
      },
      spec: {
        containers: [
          {
            image:           '',
            imagePullPolicy: 'Always',
            name:            'container-0'
          }
        ],
        imagePullSecrets: [],
        restartPolicy:    'Always'
      }
    }
  }
};

const DEFAULT_SERVICE = {
  type:     SERVICE,
  metadata: {
    name:      '',
    namespace: UI_PLUGIN_NAMESPACE,
    labels:    { [UI_PLUGIN_LABELS.CATALOG_IMAGE]: '' }
  },
  spec: {
    ports: [
      {
        name:       '',
        port:       8080,
        protocol:   'TCP',
        targetPort: 8080
      }
    ],
    selector: { [UI_PLUGIN_LABELS.CATALOG_IMAGE]: '' },
    type:     'ClusterIP'
  }
};

const DEFAULT_REPO = {
  type:     CATALOG.CLUSTER_REPO,
  metadata: {
    name:   '',
    labels: { [UI_PLUGIN_LABELS.CATALOG_IMAGE]: '' }
  },
  spec: { url: null }
};

const initialState = () => {
  const deploymentValues = structuredClone(DEFAULT_DEPLOYMENT);
  const serviceValues = structuredClone(DEFAULT_SERVICE);
  const repoValues = structuredClone(DEFAULT_REPO);

  return {
    deploymentValues,
    serviceValues,
    repoValues,
    canModifyName:              true,
    canModifyImage:             true,
    imagePullSecrets:           [],
    imagePullNamespacedSecrets: [],
    extensionUrl:               null,
    extensionDeployment:        null,
    extensionSvc:               null,
    extensionRepo:              null,
    extensionCrd:               null
  };
};

export default {
  emits: ['closed', 'refresh'],

  components: {
    AsyncButton, Banner, LabeledInput, Loading, LabeledSelect, AppModal,
  },

  mixins: [ResourceManager],

  async fetch() {
    const hash = {};

    if ( this.$store.getters['management/canList'](WORKLOAD_TYPES.DEPLOYMENT) ) {
      hash.deployments = this.$store.dispatch('management/findAll', { type: WORKLOAD_TYPES.DEPLOYMENT });
    }

    if ( this.$store.getters['management/canList'](SERVICE) ) {
      hash.services = this.$store.dispatch('management/findAll', { type: SERVICE });
    }

    await allHash(hash);

    this.secondaryResourceData = this.secondaryResourceDataConfig();
    this.resourceManagerFetchSecondaryResources(this.secondaryResourceData);
  },

  data() {
    return {
      ...initialState(),
      secondaryResourceData: null,
      showModal:             false,
      returnFocusSelector:   '[data-testid="extensions-catalog-load-dialog"]'
    };
  },

  computed: {
    ...mapGetters({ allRepos: 'catalog/repos' }),

    namespacedDeployments() {
      return this.$store.getters['management/all'](WORKLOAD_TYPES.DEPLOYMENT).filter((dep) => dep.metadata.namespace === UI_PLUGIN_NAMESPACE);
    },

    namespacedServices() {
      return this.$store.getters['management/all'](SERVICE).filter((svc) => svc.metadata.namespace === UI_PLUGIN_NAMESPACE);
    }
  },

  methods: {
    secondaryResourceDataConfig() {
      return {
        namespace: UI_PLUGIN_NAMESPACE,
        data:      {
          [SECRET]: {
            applyTo: [
              {
                var:         'imagePullNamespacedSecrets',
                parsingFunc: (data) => {
                  return data.filter((secret) => (secret._type === SECRET_TYPES.DOCKER || secret._type === SECRET_TYPES.DOCKER_JSON));
                }
              }
            ]
          }
        }
      };
    },

    showDialog() {
      this.showModal = true;
    },

    closeDialog(result) {
      this.showModal = false;
      this.$emit('closed', result);

      // Reset state
      Object.assign(this.$data, initialState());
      this.secondaryResourceData = this.secondaryResourceDataConfig();
      this.resourceManagerFetchSecondaryResources(this.secondaryResourceData);
    },

    async loadImage(btnCb) {
      try {
        if (!isEmpty(this.deploymentValues.spec.template.spec.containers[0].image)) {
          const image = this.deploymentValues.spec.template.spec.containers[0].image;
          const name = this.extractImageName(image);

          if (name) {
            // Create deployment
            await this.loadDeployment(image, name, btnCb);

            if (this.extensionDeployment) {
              // Create service
              await this.loadService(name, btnCb);
            }

            if (this.extensionSvc) {
              // Create helm repo
              await this.loadRepo(name, btnCb);
            }

            if (this.extensionRepo) {
              btnCb(true);
              this.closeDialog();
              this.$store.dispatch('growl/success', {
                title:   this.t('plugins.manageCatalog.imageLoad.success.title', { name }),
                message: this.t('plugins.manageCatalog.imageLoad.success.message'),
                timeout: 4000,
              }, { root: true });
              this.$emit('refresh');
            }
          } else {
            throw new Error('Unable to determine image name');
          }
        }
      } catch (e) {
        this.handleGrowlError(e, true);
        btnCb(false);
      }
    },

    async loadDeployment(image, name, btnCb) {
      const exists = this.namespacedDeployments.find((dep) => dep.spec.template.spec.containers[0].image === image);

      if (!exists) {
        // Sets deploymentValues with name, labels, and imagePullSecrets
        const deploymentValues = this.parseDeploymentValues(name);

        this.extensionDeployment = await this.$store.dispatch('management/create', deploymentValues);

        try {
          await this.extensionDeployment.save();
        } catch (e) {
          this.handleGrowlError(e, true);
          btnCb(false);
        }
      } else {
        const error = {
          _statusText: this.t('plugins.manageCatalog.imageLoad.error.exists.deployment.title'),
          message:     this.t('plugins.manageCatalog.imageLoad.error.exists.deployment.message', { image })
        };

        this.handleGrowlError(error);
        btnCb(false);
      }
    },

    async loadService(name, btnCb) {
      const serviceName = `${ name }-svc`;
      const exists = this.namespacedServices.find((svc) => svc.metadata.name === serviceName);

      if (exists) {
        const error = {
          _statusText: this.t('plugins.manageCatalog.imageLoad.error.exists.service.title'),
          message:     this.t('plugins.manageCatalog.imageLoad.error.exists.service.message', { svc: serviceName })
        };

        this.handleGrowlError(error, true);
        btnCb(false);

        return;
      }

      // Sets serviceValues with name, label, and selector
      const serviceValues = this.parseServiceValues(name, serviceName);
      const serviceResource = await this.$store.dispatch('management/create', serviceValues);

      try {
        await serviceResource.save();
      } catch (e) {
        this.handleGrowlError(e, true);
        btnCb(false);

        return;
      }

      try {
        this.extensionSvc = await this.$store.dispatch('management/find', {
          type:      SERVICE,
          id:        `${ UI_PLUGIN_NAMESPACE }/${ serviceResource.metadata.name }`,
          namespace: UI_PLUGIN_NAMESPACE
        });

        if (this.extensionSvc) {
          this.extensionUrl = `http://${ this.extensionSvc.spec.clusterIP }:${ this.extensionSvc.spec.ports[0].port }`;
        } else {
          throw new Error('Error fetching extension service');
        }
      } catch (e) {
        this.handleGrowlError(e, true);
        btnCb(false);
      }
    },

    async loadRepo(name, btnCb) {
      const chartName = `${ name }-charts`;
      const exists = this.allRepos.find((repo) => repo.metadata.name === chartName);

      if (exists) {
        const error = {
          _statusText: this.t('plugins.manageCatalog.imageLoad.error.exists.repo.title'),
          message:     this.t('plugins.manageCatalog.imageLoad.error.exists.repo.message', { repo: chartName })
        };

        this.handleGrowlError(error);
        btnCb(false);
        this.clean();

        return;
      }

      // Set repoValues with name, label, and url
      const repoValues = this.parseRepoValues(chartName);

      this.extensionRepo = await this.$store.dispatch('management/create', repoValues);

      try {
        await this.extensionRepo.save();
      } catch (e) {
        this.handleGrowlError(e, true);
        btnCb(false);
      }
    },

    parseDeploymentValues(name) {
      let out = {};

      this.deploymentValues.metadata['name'] = name;

      const addLabel = { [UI_PLUGIN_LABELS.CATALOG_IMAGE]: name };
      const addTo = ['metadata.labels', 'spec.selector.matchLabels', 'spec.template.metadata.labels'];

      // Populates workloadselector labels
      out = this.assignLabels(this.deploymentValues, addLabel, addTo);

      if (this.imagePullSecrets.length) {
        out.spec.template.spec.imagePullSecrets = this.imagePullSecrets.map((secret) => {
          return { name: secret };
        });
      }

      return out;
    },

    parseServiceValues(name, serviceName) {
      const out = this.serviceValues;

      out.metadata.name = serviceName;
      out.metadata.labels[UI_PLUGIN_LABELS.CATALOG_IMAGE] = name;
      out.spec.selector[UI_PLUGIN_LABELS.CATALOG_IMAGE] = name;

      return out;
    },

    parseRepoValues(chartName) {
      const out = this.repoValues;

      out.metadata.name = chartName;
      out.metadata.labels[UI_PLUGIN_LABELS.CATALOG_IMAGE] = this.deploymentValues.metadata.name;
      out.spec.url = this.extensionUrl;

      return out;
    },

    assignLabels(source, labels, args) {
      for (let i = 0; i < args.length; i++) {
        const path = args[i].split('.');
        let currentObj = source;

        for (let j = 0; j < path.length - 1; j++) {
          currentObj = currentObj[path[j]];
        }

        currentObj[path[path.length - 1]] = labels;
      }

      return source;
    },

    extractImageVersion(image) {
      // Returns the version number with optional pre-release identifiers
      const regex = /:(\d+\.\d+\.\d+([-\w\d]+)*)$/;
      const matches = regex.exec(image);

      if (matches) {
        return matches[1];
      }

      return null;
    },

    extractImageName(image) {
      // Returns the name within the image that prefixes the version number
      const regex = /\/([^/:]+)(?::\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?|$)/;
      const matches = regex.exec(image);

      if (matches) {
        return matches[1];
      }

      return null;
    },

    clean() {
      // Remove failed resources
      if (this.extensionDeployment) {
        this.extensionDeployment.remove();
      }
      if (this.extensionSvc) {
        this.extensionSvc.remove();
      }
      if (this.extensionRepo) {
        this.extensionRepo.remove();
      }
    },

    handleGrowlError(e, clean = false) {
      const error = e?.data || e;

      this.$store.dispatch('growl/error', {
        title:   error._statusText,
        message: error.message,
        timeout: 5000,
      }, { root: true });

      if (clean) {
        this.clean();
      }
    }
  }
};
</script>

<template>
  <app-modal
    v-if="showModal"
    name="catalogLoadDialog"
    height="auto"
    :scrollable="true"
    :trigger-focus-trap="true"
    :return-focus-selector="returnFocusSelector"
    @close="closeDialog()"
  >
    <Loading
      v-if="$fetchState.loading"
      mode="relative"
    />
    <div
      v-else
      class="plugin-install-dialog"
    >
      <div>
        <h4>
          {{ t('plugins.manageCatalog.imageLoad.load') }}
        </h4>
        <p>
          {{ t('plugins.manageCatalog.imageLoad.prompt') }}
        </p>

        <div class="custom mt-10">
          <Banner
            color="info"
            :label="t('plugins.manageCatalog.imageLoad.banner')"
            class="mt-10"
          />
        </div>

        <div class="custom mt-10">
          <div class="fields">
            <LabeledInput
              v-model:value.trim="deploymentValues.spec.template.spec.containers[0].image"
              label-key="plugins.manageCatalog.imageLoad.fields.image.label"
              placeholder-key="plugins.manageCatalog.imageLoad.fields.image.placeholder"
            />
          </div>
        </div>
        <div class="custom mt-10">
          <div class="fields">
            <LabeledSelect
              v-model:value="imagePullSecrets"
              :label="t('plugins.manageCatalog.imageLoad.fields.imagePullSecrets.label')"
              :tooltip="t('plugins.manageCatalog.imageLoad.fields.imagePullSecrets.tooltip')"
              :multiple="true"
              :taggable="true"
              :options="imagePullNamespacedSecrets"
              option-label="metadata.name"
              :reduce="service => service.metadata.name"
            />
            <Banner
              color="warning"
              class="mt-10"
            >
              <span v-clean-html="t('plugins.manageCatalog.imageLoad.fields.secrets.banner', {}, true)" />
            </Banner>
          </div>
        </div>
      </div>

      <div class="custom mt-10">
        <div class="fields">
          <div class="dialog-buttons mt-20">
            <button
              class="btn role-secondary"
              data-testid="image-load-ext-modal-cancel-btn"
              @click="closeDialog()"
            >
              {{ t('generic.cancel') }}
            </button>
            <AsyncButton
              mode="load"
              data-testid="image-load-ext-modal-install-btn"
              @click="loadImage"
            />
          </div>
        </div>
      </div>
    </div>
  </app-modal>
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
