<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import WorkLoadMixin from '@shell/edit/workload/mixins/workload';
import { mapGetters } from 'vuex';

export default {
  name:   'Workload',
  emits:  ['input'],
  mixins: [CreateEditView, FormValidation, WorkLoadMixin], // The order here is important since WorkLoadMixin contains some FormValidation configuration
  props:  {
    value: {
      type:     Object,
      required: true,
    },

    mode: {
      type:    String,
      default: 'create',
    },
  },
  data() {
    return { selectedName: null, closedErrorMessages: [] };
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    errorMessages() {
      if (!this.type) {
        return [];
      }

      return this.fvUnreportedValidationErrors.filter((e) => !this.closedErrorMessages.includes(e));
    }
  },
  methods: {
    changed(tab) {
      const key = this.idKey;

      this.selectedName = tab.selectedName;
      const container = this.containerOptions.find( (c) => c[key] === tab.selectedName);

      if ( container ) {
        this.selectContainer(container);
      }
    },

    /**
     * Find error exceptions to be mapped for each case
     */
    mapError(error) {
      const isObject = error && typeof error === 'object' && !Array.isArray(error);
      // We have just 2 cases, so we'll set a ternary operation:
      // - one is for when we submit a YAML edited form (object - YAMLexceptions)
      // - other is for a string message
      const errorMessage = isObject ? error.message || '' : error || '';

      switch (true) {
      case errorMessage.includes('violates PodSecurity'): {
        const match = errorMessage.match(/\"(.*?)\"/gi);
        const name = match[0];
        const policy = match[1];

        return { message: this.t('workload.error', { name, policy }) };
      }
      default:
        break;
      }
    },

    /**
     * Map all the error texts to a message and icon object
     */
    getErrorsMap(errors) {
      return !errors || !Array.isArray(errors) ? {} : errors.reduce((acc, error) => ({
        ...acc,
        [error]: this.mapError(error) || {
          message: error,
          icon:    null
        }
      }), {});
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <form
    v-else
    class="filled-height"
  >
    <CruResource
      :validation-passed="fvFormIsValid"
      :selected-subtype="type"
      :resource="value"
      :mode="mode"
      :errors="errorMessages"
      :done-route="doneRoute"
      :subtypes="workloadSubTypes"
      :apply-hooks="applyHooks"
      :value="value"
      :errors-map="getErrorsMap(fvUnreportedValidationErrors)"
      @finish="save"
      @select-type="selectType"
      @error="(_, closedError) => closedErrorMessages.push(closedError)"
    >
      <NameNsDescription
        :value="value"
        :mode="mode"
        :rules="{name: fvGetAndReportPathRules('metadata.name'), namespace: fvGetAndReportPathRules('metadata.namespace'), description: []}"
        @change="name=value.metadata.name"
        @isNamespaceNew="isNamespaceNew = $event"
      />
      <div
        v-if="isCronJob || isReplicable || isStatefulSet || containerOptions.length > 1"
        class="row mb-20"
      >
        <div
          v-if="isCronJob"
          class="col span-3"
        >
          <LabeledInput
            v-model:value="spec.schedule"
            type="cron"
            required
            :mode="mode"
            :label="t('workload.cronSchedule')"
            :rules="fvGetAndReportPathRules('spec.schedule')"
            placeholder="0 * * * *"
          />
        </div>
        <div
          v-if="isReplicable"
          class="col span-3"
        >
          <LabeledInput
            v-model:value.number="spec.replicas"
            type="number"
            min="0"
            required
            :mode="mode"
            :label="t('workload.replicas')"
          />
        </div>
        <div
          v-if="isStatefulSet"
          class="col span-3"
        >
          <LabeledSelect
            v-model:value="spec.serviceName"
            option-label="metadata.name"
            :reduce="service=>service.metadata.name"
            :mode="mode"
            :label="t('workload.serviceName')"
            :options="headlessServices"
            required
          />
        </div>
      </div>
      <Tabbed
        ref="containersTabbed"
        class="deployment-tabs"
        :show-tabs-add-remove="true"
        :default-tab="defaultTab"
        :flat="true"
        data-testid="workload-horizontal-tabs"
        @changed="changed"
      >
        <Tab
          v-for="(tab, i) in allContainers"
          :key="i"
          :label="tab.name"
          :name="tab[idKey]"
          :weight="tab.weight"
          :error="!!tab.error"
        >
          <Tabbed
            :side-tabs="true"
            :weight="99"
            :data-testid="`workload-container-tabs-${i}`"
          >
            <Tab
              :label="t('workload.container.titles.general')"
              name="general"
              :weight="tabWeightMap['general']"
              :error="tabErrors.general"
            >
              <template
                #tab-header-right
              >
                <button
                  v-if="allContainers.length > 1 && !isView"
                  type="button"
                  class="btn-sm role-link"
                  @click="removeContainer(tab)"
                >
                  {{ t('workload.container.removeContainer') }}
                </button>
              </template>
              <div>
                <div
                  :style="{'align-items':'center'}"
                  class="row mb-20"
                >
                  <div class="col span-6">
                    <LabeledInput
                      v-model:value="allContainers[i].name"
                      :mode="mode"
                      :label="t('workload.container.containerName')"
                    />
                  </div>
                  <div class="col span-6">
                    <RadioGroup
                      :mode="mode"
                      :value="allContainers[i]._init"
                      name="initContainer"
                      :options="[true, false]"
                      :labels="[t('workload.container.init'), t('workload.container.standard')]"
                      @update:value="updateInitContainer($event, allContainers[i])"
                    />
                  </div>
                </div>
                <h3>{{ t('workload.container.titles.image') }}</h3>
                <div class="row mb-20">
                  <div class="col span-6">
                    <LabeledInput
                      v-model:value.trim="allContainers[i].image"
                      :mode="mode"
                      :label="t('workload.container.image')"
                      :placeholder="t('generic.placeholder', {text: 'nginx:latest'}, true)"
                      :rules="fvGetAndReportPathRules('image')"
                    />
                  </div>
                  <div class="col span-6">
                    <LabeledSelect
                      v-model:value="allContainers[i].imagePullPolicy"
                      :label="t('workload.container.imagePullPolicy')"
                      :options="pullPolicyOptions"
                      :mode="mode"
                    />
                  </div>
                </div>
                <div class="row">
                  <div class="col span-6">
                    <LabeledSelect
                      v-model:value="imagePullSecrets"
                      :label="t('workload.container.imagePullSecrets.label')"
                      :multiple="true"
                      :taggable="true"
                      :options="imagePullNamespacedSecrets"
                      :mode="mode"
                      option-label="metadata.name"
                      :reduce="service=>service.metadata.name"
                      :create-option="createOption"
                      :tooltip="t('workload.container.imagePullSecrets.tooltip')"
                    />
                  </div>
                </div>
              </div>
              <div class="spacer" />
              <div>
                <h3>
                  {{ t('workload.container.ports.expose') }}
                  <i
                    v-clean-tooltip="{content: t('workload.container.ports.toolTip'), triggers: ['hover', 'touch', 'focus'] }"
                    v-stripped-aria-label="t('workload.container.ports.toolTip')"
                    class="icon icon-info"
                    tabindex="0"
                  />
                </h3>
                <p class="padded">
                  {{ t('workload.container.ports.description') }}
                </p>
                <div class="row">
                  <WorkloadPorts
                    v-model:value="allContainers[i].ports"
                    :name="value.metadata.name"
                    :services="servicesOwned"
                    :mode="mode"
                  />
                </div>
              </div>
              <div class="spacer" />
              <div>
                <h3>{{ t('workload.container.titles.command') }}</h3>
                <Command
                  v-model:value="allContainers[i]"
                  :secrets="namespacedSecrets"
                  :config-maps="namespacedConfigMaps"
                  :mode="mode"
                  :loading="isLoadingSecondaryResources"
                />
              </div>
              <ServiceNameSelect
                :value="podTemplateSpec.serviceAccountName"
                :mode="mode"
                :select-label="t('workload.serviceAccountName.label')"
                :select-placeholder="t('workload.serviceAccountName.label')"
                :options="namespacedServiceNames"
                option-label="metadata.name"
                :loading="isLoadingSecondaryResources"
                @update:value="updateServiceAccount"
              />
              <div class="spacer" />
              <div>
                <h3>{{ t('workload.container.titles.lifecycle') }}</h3>
                <LifecycleHooks
                  v-model:value="allContainers[i].lifecycle"
                  :mode="mode"
                />
              </div>
            </Tab>
            <Tab
              :label="t('workload.container.titles.resources')"
              name="resources"
              :weight="tabWeightMap['resources']"
            >
              <!-- Resources and Limitations -->
              <ContainerResourceLimit
                v-model:value="flatResources"
                :mode="mode"
                :show-tip="false"
              />
            </Tab>

            <Tab
              v-if="!allContainers[i]._init"
              :label="t('workload.container.titles.healthCheck')"
              name="healthCheck"
              :weight="tabWeightMap['healthCheck']"
            >
              <HealthCheck
                :value="allContainers[i]"
                :mode="mode"
                @update:value="Object.assign(allContainers[i], $event)"
              />
            </Tab>
            <Tab
              :label="t('workload.container.titles.securityContext')"
              name="securityContext"
              :weight="tabWeightMap['securityContext']"
            >
              <Security
                v-model:value="allContainers[i].securityContext"
                :mode="mode"
              />
            </Tab>
            <Tab
              :label="t('workload.storage.title')"
              name="storage"
              :weight="tabWeightMap['storage']"
            >
              <ContainerMountPaths
                v-model:container="allContainers[i]"
                :value="podTemplateSpec"
                :namespace="value.metadata.namespace"
                :register-before-hook="registerBeforeHook"
                :mode="mode"
                :secrets="namespacedSecrets"
                :config-maps="namespacedConfigMaps"
                :save-pvc-hook-name="savePvcHookName"
                @removePvcForm="clearPvcFormState"
              />
            </Tab>
          </Tabbed>
        </Tab>
        <Tab
          v-if="!isPod"
          :label="nameDisplayFor(type)"
          :name="nameDisplayFor(type)"
          :weight="99"
        >
          <Tabbed
            data-testid="workload-general-tabs"
            :side-tabs="true"
          >
            <Tab
              name="labels"
              label-key="generic.labelsAndAnnotations"
              :weight="tabWeightMap['labels']"
            >
              <Labels
                :value="value"
                :mode="mode"
                @update:value="$emit('input', $event)"
              />
            </Tab>
            <Tab
              :label="t('workload.container.titles.upgrading')"
              name="upgrading"
              :weight="tabWeightMap['upgrading']"
            >
              <Job
                v-if="isJob || isCronJob"
                v-model:value="spec"
                :mode="mode"
                :type="type"
              />
              <Upgrading
                v-else
                v-model:value="spec"
                :mode="mode"
                :type="type"
                :no-pod-spec="true"
              />
            </Tab>
          </Tabbed>
        </Tab>
        <Tab
          :label="t('workload.tabs.labels.pod')"
          :name="'pod'"
          :weight="98"
        >
          <Tabbed
            data-testid="workload-pod-tabs"
            :side-tabs="true"
          >
            <Tab
              :label="t('workload.storage.title')"
              name="storage-pod"
              :weight="tabWeightMap['storage']"
              @active="$refs.storage.refresh()"
            >
              <Storage
                ref="storage"
                v-model:value="podTemplateSpec"
                :namespace="value.metadata.namespace"
                :register-before-hook="registerBeforeHook"
                :mode="mode"
                :secrets="namespacedSecrets"
                :config-maps="namespacedConfigMaps"
                :save-pvc-hook-name="savePvcHookName"
                :loading="isLoadingSecondaryResources"
                :namespaced-pvcs="pvcs"
                @removePvcForm="clearPvcFormState"
              />
            </Tab>
            <Tab
              :label="t('workload.container.titles.resources')"
              name="resources"
              :weight="tabWeightMap['resources']"
            >
              <div>
                <div>
                  <h3 class="mb-10">
                    <t k="workload.scheduling.titles.tolerations" />
                  </h3>
                  <div class="row">
                    <Tolerations
                      v-model:value="podTemplateSpec.tolerations"
                      :mode="mode"
                    />
                  </div>
                </div>

                <div>
                  <div class="spacer" />
                  <h3 class="mb-10">
                    <t k="workload.scheduling.titles.priority" />
                  </h3>
                  <div class="row">
                    <div class="col span-6">
                      <LabeledInput
                        v-model:value.number="podTemplateSpec.priority"
                        :mode="mode"
                        :label="t('workload.scheduling.priority.priority')"
                      />
                    </div>
                    <div class="col span-6">
                      <LabeledInput
                        v-model:value="podTemplateSpec.priorityClassName"
                        :mode="mode"
                        :label="t('workload.scheduling.priority.className')"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Tab>
            <Tab
              :label="t('workload.container.titles.podScheduling')"
              name="podScheduling"
              :weight="tabWeightMap['podScheduling']"
            >
              <PodAffinity
                :mode="mode"
                :value="podTemplateSpec"
                :nodes="allNodeObjects"
                :loading="isLoadingSecondaryResources"
              />
            </Tab>
            <Tab
              :label="t('workload.container.titles.nodeScheduling')"
              name="nodeScheduling"
              :weight="tabWeightMap['nodeScheduling']"
            >
              <NodeScheduling
                :mode="mode"
                :value="podTemplateSpec"
                :nodes="allNodes"
                :loading="isLoadingSecondaryResources"
              />
            </Tab>
            <Tab
              :label="t('workload.container.titles.upgrading')"
              name="upgrading"
              :weight="tabWeightMap['upgrading']"
            >
              <Job
                v-if="isJob || isCronJob"
                v-model:value="spec"
                :mode="mode"
                :type="type"
              />
              <Upgrading
                v-else
                v-model:value="spec"
                :mode="mode"
                :type="type"
                :no-deployment-spec="true"
              />
            </Tab>
            <Tab
              :label="t('workload.container.titles.securityContext')"
              name="securityContext"
              :weight="tabWeightMap['securityContext']"
            >
              <div>
                <h3>{{ t('workload.container.security.podFsGroup') }}</h3>
                <div class="row">
                  <div class="col span-6">
                    <LabeledInput
                      v-model:value.number="podFsGroup"
                      type="number"
                      :mode="mode"
                      :label="t('workload.container.security.fsGroup')"
                    />
                  </div>
                </div>
              </div>
            </Tab>
            <Tab
              :label="t('workload.container.titles.networking')"
              name="networking"
              :weight="tabWeightMap['networking']"
            >
              <Networking
                v-model:value="podTemplateSpec"
                :mode="mode"
              />
            </Tab>
            <Tab
              v-if="isStatefulSet"
              :label="t('workload.container.titles.volumeClaimTemplates')"
              name="volumeClaimTemplates"
              :weight="tabWeightMap['volumeClaimTemplates']"
            >
              <VolumeClaimTemplate
                v-model:value="spec"
                :mode="mode"
              />
            </Tab>
            <Tab
              name="labels"
              label-key="generic.labelsAndAnnotations"
              :weight="tabWeightMap['labels']"
            >
              <div>
                <h3>{{ t('workload.container.titles.podLabels') }}</h3>
                <div class="row mb-20">
                  <KeyValue
                    key="labels"
                    v-model:value="podLabels"
                    :add-label="t('labels.addLabel')"
                    :mode="mode"
                    :read-allowed="false"
                    :protip="false"
                  />
                </div>
                <div class="spacer" />
                <h3>{{ t('workload.container.titles.podAnnotations') }}</h3>
                <div class="row">
                  <KeyValue
                    key="annotations"
                    v-model:value="podAnnotations"
                    :add-label="t('labels.addAnnotation')"
                    :mode="mode"
                    :read-allowed="false"
                    :protip="false"
                  />
                </div>
              </div>
            </Tab>
          </Tabbed>
        </Tab>
        <template #tab-row-extras>
          <li class="tablist-controls">
            <button
              v-if="!isView"
              type="button"
              class="btn-sm role-link"
              @click="addContainerBtn"
            >
              <i class="icon icon-plus pr-5" /> {{ t('workload.container.addContainer') }}
            </button>
          </li>
        </template>
      </Tabbed>
    </CruResource>
  </form>
</template>

<style lang='scss'>
.container-row {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.type-placeholder {
  color: white;
  font-size: 2.5em;
  height: 100%;
  width: 100%;
  background-color: var(--primary);
  display: flex;
  justify-content: center;
  align-items: center;
}

.type-description {
  color: var(--input-label);
}

.next-dropdown {
  display: inline-block;
}

.tab-external-controls {
  display: flex;
  justify-content: right;
}

.tab-content-controls {
  display: flex;
  justify-content: right;
}

.tablist-controls {
  .role-link {
    padding: 10px 15px;
    min-height: unset;
    line-height: unset;

    &:focus {
      background: none;
      box-shadow: none;
    }

    &:hover {
      border: none;
    }
  }

}

.deployment-tabs {
  > .tabs.horizontal {
    border-bottom: 1px solid var(--border);
    margin-bottom: 10px;
  }
}
.padded {
  padding-bottom: 10px;
}
</style>
