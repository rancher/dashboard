<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import WorkLoadMixin from '@shell/edit/workload/mixins/workload';

export default {
  name:       'WorkloadGeneric',
  mixins: [CreateEditView, FormValidation, WorkLoadMixin], // The order here is important since WorkLoadMixin contains some FormValidation configuration
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
        <div v-if="containerOptions.length > 1" class="col span-3">
          <LabeledSelect :value="container" option-label="name" :label="t('workload.container.titles.container')" :options="containerOptions" @input="selectContainer" />
          <div class="delete-container-button">
            <button v-if="allContainers.length > 1 && !isView" type="button" class="btn-sm role-link" @click="removeContainer(container)">
              {{ t('workload.container.removeContainer') }}
            </button>
          </div>
        </div>
      </div>

      <Tabbed :key="containerChange" :side-tabs="true">
        <Tab :label="t('workload.container.titles.general')" name="general" :weight="tabWeightMap['general']" :error="tabErrors.general">
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

          <div class="spacer"></div>
          <div>
            <h3>{{ t('workload.container.titles.ports') }}</h3>
            <div class="row">
              <WorkloadPorts v-model="container.ports" :name="value.metadata.name" :services="servicesOwned" :mode="mode" />
            </div>
          </div>

          <div class="spacer"></div>
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

          <div class="spacer"></div>
          <div>
            <h3>{{ t('workload.container.titles.lifecycle') }}</h3>
            <LifecycleHooks v-model="container.lifecycle" :mode="mode" />
          </div>
        </Tab>
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
          <h3 class="mb-10">
            <t k="workload.scheduling.titles.limits" />
          </h3>
          <ContainerResourceLimit v-model="flatResources" :mode="mode" :show-tip="false" />
          <template>
            <div class="spacer"></div>
            <div>
              <h3 class="mb-10">
                <t k="workload.scheduling.titles.tolerations" />
              </h3>
              <div class="row">
                <Tolerations v-model="podTemplateSpec.tolerations" :mode="mode" />
              </div>
            </div>

            <div>
              <div class="spacer"></div>
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
          <Upgrading v-else v-model="spec" :mode="mode" :type="type" />
        </Tab>
        <Tab v-if="!isInitContainer" :label="t('workload.container.titles.healthCheck')" name="healthCheck" :weight="tabWeightMap['healthCheck']">
          <HealthCheck v-model="healthCheck" :mode="mode" />
        </Tab>
        <Tab :label="t('workload.container.titles.securityContext')" name="securityContext" :weight="tabWeightMap['securityContext']">
          <Security v-model="container.securityContext" :mode="mode" />
          <div class="spacer"></div>
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
          <Labels v-model="value" :mode="mode" />
          <div class="spacer"></div>
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
            <div class="spacer"></div>
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
</style>
