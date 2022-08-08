<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import WorkLoadMixin from '@shell/edit/workload/mixins/workload';

export default {
  name:       'WorkloadDeployments',
  mixins:     [CreateEditView, FormValidation, WorkLoadMixin], // The order here is important since WorkLoadMixin contains some FormValidation configuration

  data() {
    return { selectedName: null };
  },
  methods: {
    changed(tab) {
      this.selectedName = tab.selectedName;
      const container = this.containerOptions.find( c => c.name === tab.selectedName);

      if ( container ) {
        this.selectContainer(container);
      }
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <form v-else class="filled-height">
    <CruResource
      :validation-passed="fvFormIsValid"
      :selected-subtype="type"
      :resource="value"
      :mode="mode"
      :errors="fvUnreportedValidationErrors"
      :done-route="doneRoute"
      :subtypes="workloadSubTypes"
      :apply-hooks="applyHooks"
      :value="value"
      @finish="save"
      @select-type="selectType"
      @error="e=>errors = e"
    >
      <!-- <pre>{{ JSON.stringify(allContainers, null, 2) }}</pre> -->
      <NameNsDescription
        :value="value"
        :mode="mode"
        :rules="{name: fvGetAndReportPathRules('metadata.name'), namespace: fvGetAndReportPathRules('metadata.namespace'), description: []}"
        @change="name=value.metadata.name"
      />
      <div v-if="isCronJob || isReplicable || isStatefulSet || containerOptions.length > 1" class="row mb-20">
        <div v-if="isCronJob" class="col span-3">
          <LabeledInput
            v-model="spec.schedule"
            type="cron"
            required
            :mode="mode"
            :label="t('workload.cronSchedule')"
            :rules="fvGetAndReportPathRules('spec.schedule')"
            placeholder="0 * * * *"
          />
        </div>
        <div v-if="isReplicable" class="col span-3">
          <LabeledInput
            v-model.number="spec.replicas"
            type="number"
            min="0"
            required
            :mode="mode"
            :label="t('workload.replicas')"
          />
        </div>
        <div v-if="isStatefulSet" class="col span-3">
          <LabeledSelect
            v-model="spec.serviceName"
            option-label="metadata.name"
            :reduce="service=>service.metadata.name"
            :mode="mode"
            :label="t('workload.serviceName')"
            :options="headlessServices"
            required
          />
        </div>
      </div>
      <Tabbed class="deployment-tabs">
        <Tab :label="t('workload.tabs.labels.containers')" name="containers" :error="tabErrors.general">
          <Tabbed :side-tabs="true" @changed="changed">
            <Tab
              v-for="(tab, i) in allContainers"
              :key="i"
              :label="tab.name"
              :name="tab.name"
              :weight="tab.weight"
              :error="!!tab.error"
            >
              <template #tab-header-right class="tab-content-controls">
                <button v-if="allContainers.length > 1 && !isView" type="button" class="btn-sm role-link" @click="removeContainer(tab)">
                  {{ t('workload.container.removeContainer') }}
                </button>
              </template>
              <div>
                <div :style="{'align-items':'center'}" class="row mb-20">
                  <div class="col span-6">
                    <LabeledInput v-model="container.name" :mode="mode" :label="t('workload.container.containerName')" />
                  </div>
                  <div class="col span-6">
                    <RadioGroup
                      :mode="mode"
                      :value="isInitContainer"
                      name="initContainer"
                      :options="[true, false]"
                      :labels="[t('workload.container.init'), t('workload.container.standard')]"
                      @input="updateInitContainer"
                    />
                  </div>
                </div>
                <h3>{{ t('workload.container.titles.image') }}</h3>
                <div class="row mb-20">
                  <div class="col span-6">
                    <LabeledInput
                      v-model.trim="container.image"
                      :mode="mode"
                      :label="t('workload.container.image')"
                      :placeholder="t('generic.placeholder', {text: 'nginx:latest'}, true)"
                      :rules="fvGetAndReportPathRules('image')"
                    />
                  </div>
                  <div class="col span-6">
                    <LabeledSelect
                      v-model="container.imagePullPolicy"
                      :label="t('workload.container.imagePullPolicy')"
                      :options="pullPolicyOptions"
                      :mode="mode"
                    />
                  </div>
                </div>
                <div class="row">
                  <div class="col span-6">
                    <LabeledSelect
                      v-model="imagePullSecrets"
                      :label="t('workload.container.imagePullSecrets')"
                      :multiple="true"
                      :taggable="true"
                      :options="namespacedSecrets"
                      :mode="mode"
                      option-label="metadata.name"
                      :reduce="service=>service.metadata.name"
                    />
                  </div>
                </div>
              </div>
              <div v-if="!isInitContainer" class="healthcheck">
                <div class="spacer" />
                <h2>{{ t('workload.container.titles.healthCheck') }} </h2>
                <HealthCheck v-model="healthCheck" :mode="mode" />
              </div>
              <div class="spacer" />
              <div>
                <h3>{{ t('workload.container.titles.ports') }}</h3>
                <div class="row">
                  <WorkloadPorts v-model="container.ports" :name="value.metadata.name" :services="servicesOwned" :mode="mode" />
                </div>
              </div>
              <div class="spacer" />
              <!-- Resources and Limitations -->
              <div>
                <h2 class="mb-10">
                  <t k="workload.scheduling.titles.limits" />
                </h2>
                <ContainerResourceLimit v-model="flatResources" :mode="mode" :show-tip="false" />
              </div>
              <div class="spacer" />
              <div>
                <h2>{{ t('workload.container.titles.securityContext') }} </h2>
                <Security v-model="container.securityContext" :mode="mode" />
              </div>
              <div class="spacer" />
              <div>
                <h3>{{ t('workload.container.titles.command') }}</h3>
                <Command v-model="container" :secrets="namespacedSecrets" :config-maps="namespacedConfigMaps" :mode="mode" />
              </div>
              <ServiceNameSelect
                :value="podTemplateSpec.serviceAccountName"
                :mode="mode"
                :select-label="t('workload.serviceAccountName.label')"
                :select-placeholder="t('workload.serviceAccountName.label')"
                :options="namespacedServiceNames"
                option-label="metadata.name"
                @input="updateServiceAccount"
              />
              <div class="spacer" />
              <div>
                <h3>{{ t('workload.container.titles.lifecycle') }}</h3>
                <LifecycleHooks v-model="container.lifecycle" :mode="mode" />
              </div>
            </Tab>
            <template #tab-row-extras>
              <div class="side-tablist-controls">
                <button v-if="!isView" type="button" class="btn-sm role-link" @click="addContainerBtn">
                  {{ t('workload.container.addContainer') }}
                </button>
              </div>
            </template>
          </Tabbed>
        </Tab>
        <Tab :label="t('workload.tabs.labels.deployment')" :name="'deployment'" :weight="99">
          <Tabbed :side-tabs="true">
            <Tab name="labels" label-key="generic.labelsAndAnnotations" :weight="tabWeightMap['labels']">
              <Labels v-model="value" :mode="mode" />
            </Tab>
            <Tab :label="t('workload.container.titles.upgrading')" name="upgrading" :weight="tabWeightMap['upgrading']">
              <Job v-if="isJob || isCronJob" v-model="spec" :mode="mode" :type="type" />
              <Upgrading v-else v-model="spec" :mode="mode" :type="type" :no-pod-spec="true" />
            </Tab>
          </Tabbed>
        </Tab>
        <Tab :label="t('workload.tabs.labels.pod')" :name="'pod'" :weight="99">
          <Tabbed :side-tabs="true">
            <Tab :label="t('workload.storage.title')" name="storage" :weight="tabWeightMap['storage']">
              <Storage
                v-model="podTemplateSpec"
                :namespace="value.metadata.namespace"
                :register-before-hook="registerBeforeHook"
                :mode="mode"
                :secrets="namespacedSecrets"
                :config-maps="namespacedConfigMaps"
                :container="container"
                :save-pvc-hook-name="savePvcHookName"
                @removePvcForm="clearPvcFormState"
              />
            </Tab>
            <Tab :label="t('workload.container.titles.resources')" name="resources" :weight="tabWeightMap['resources']">
              <template>
                <div>
                  <h3 class="mb-10">
                    <t k="workload.scheduling.titles.tolerations" />
                  </h3>
                  <div class="row">
                    <Tolerations v-model="podTemplateSpec.tolerations" :mode="mode" />
                  </div>
                </div>

                <div>
                  <div class="spacer" />
                  <h3 class="mb-10">
                    <t k="workload.scheduling.titles.priority" />
                  </h3>
                  <div class="row">
                    <div class="col span-6">
                      <LabeledInput v-model.number="podTemplateSpec.priority" :mode="mode" :label="t('workload.scheduling.priority.priority')" />
                    </div>
                    <div class="col span-6">
                      <LabeledInput v-model="podTemplateSpec.priorityClassname" :mode="mode" :label="t('workload.scheduling.priority.className')" />
                    </div>
                  </div>
                </div>
              </template>
            </Tab>
            <Tab :label="t('workload.container.titles.podScheduling')" name="podScheduling" :weight="tabWeightMap['podScheduling']">
              <PodAffinity :mode="mode" :value="podTemplateSpec" :nodes="allNodeObjects" />
            </Tab>
            <Tab :label="t('workload.container.titles.nodeScheduling')" name="nodeScheduling" :weight="tabWeightMap['nodeScheduling']">
              <NodeScheduling :mode="mode" :value="podTemplateSpec" :nodes="allNodes" />
            </Tab>
            <Tab :label="t('workload.container.titles.upgrading')" name="upgrading" :weight="tabWeightMap['upgrading']">
              <Job v-if="isJob || isCronJob" v-model="spec" :mode="mode" :type="type" />
              <Upgrading v-else v-model="spec" :mode="mode" :type="type" :no-deployment-spec="true" />
            </Tab>
            <Tab :label="t('workload.container.titles.securityContext')" name="securityContext" :weight="tabWeightMap['securityContext']">
              <div>
                <h3>{{ t('workload.container.security.podFsGroup') }}</h3>
                <div class="row">
                  <div class="col span-6">
                    <LabeledInput v-model.number="podFsGroup" type="number" :mode="mode" :label="t('workload.container.security.fsGroup')" />
                  </div>
                </div>
              </div>
            </Tab>
            <Tab :label="t('workload.container.titles.networking')" name="networking" :weight="tabWeightMap['networking']">
              <Networking v-model="podTemplateSpec" :mode="mode" />
            </Tab>
            <Tab v-if="isStatefulSet" :label="t('workload.container.titles.volumeClaimTemplates')" name="volumeClaimTemplates" :weight="tabWeightMap['volumeClaimTemplates']">
              <VolumeClaimTemplate v-model="spec" :mode="mode" />
            </Tab>
            <Tab name="labels" label-key="generic.labelsAndAnnotations" :weight="tabWeightMap['labels']">
              <div>
                <h3>{{ t('workload.container.titles.podLabels') }}</h3>
                <div class="row mb-20">
                  <KeyValue
                    key="labels"
                    v-model="podLabels"
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
                    v-model="podAnnotations"
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

.side-tablist-controls {
  border-top: 1px solid var(--border);
  padding: 15px;

  .role-link {
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
</style>
