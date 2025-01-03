<script>
import debounce from 'lodash/debounce';
import jsyaml from 'js-yaml';
import { Checkbox } from '@components/Form/Checkbox';
import YamlEditor from '@shell/components/YamlEditor';
import { mapGetters } from 'vuex';
import FileSelector from '@shell/components/form/FileSelector';
import { Banner } from '@components/Banner';

const defaultOverlayFile = `#apiVersion: install.istio.io/v1alpha1
#kind: IstioOperator
#spec:
#  components:
#    ingressGateways:
#    - enabled: true
#      name: istio-ingressgateway
#    - enabled: true
#      k8s:
#        resources:
#          requests:
#            cpu: 200m
#        service:
#          ports:
#          - name: tcp-citadel-grpc-tls
#            port: 8060
#            targetPort: 8060
#          - name: tcp-dns
#            port: 5353
#        serviceAnnotations:
#          cloud.google.com/load-balancer-type: internal
#      name: ilb-gateway
#      namespace: user-ingressgateway-ns
#    - enabled: true
#      k8s:
#        resources:
#          requests:
#            cpu: 200m
#        service:
#          ports:
#          - name: tcp-citadel-grpc-tls
#            port: 8060
#            targetPort: 8060
#          - name: tcp-dns
#            port: 5353
#        serviceAnnotations:
#          cloud.google.com/load-balancer-type: internal
#      name: other-gateway
#      namespace: istio-system
`;

export default {
  emits: ['update:value'],

  components: {
    Checkbox,
    FileSelector,
    YamlEditor,
    Banner
  },

  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  data() {
    let overlayFile = this.value.overlayFile;

    if (!overlayFile?.length) {
      overlayFile = defaultOverlayFile;
    }

    return {
      overlayFile,
      showKialiBanner: this.value.kiali?.enabled
    };
  },

  computed: {
    ...mapGetters(['currentCluster'], { t: 'i18n/t' }),
    valuesYaml: {
      get() {
        try {
          const yaml = jsyaml.dump(this.value);

          return yaml;
        } catch (e) {
          return null;
        }
      },
      set: debounce(function(neu) {
        try {
          const obj = jsyaml.load(neu);

          Object.assign(this.value, obj);
        } catch (e) {

        }
      }, 500)
    },
  },

  methods: {
    update() {
      this.$emit('update:value', this.value);
    },

    valuesChanged(value) {
      try {
        jsyaml.load(value);
        if (value === defaultOverlayFile) {
          value = '';
        } else {
          this.overlayFile = value;
        }
        this.value.overlayFile = value;
      } catch (e) {
      }
    },

    onFileSelected(value) {
      this.$refs['yaml-editor'].updateValue(value);
    },

    changeKiali(value) {
      if (value && this.value.pilot) {
        this.value.pilot.enabled = true;
        this.showKialiBanner = true;
      } else if (!value) {
        this.showKialiBanner = false;
      }
    }
  }
};
</script>

<template>
  <div>
    <h3>
      {{ t('istio.titles.components') }}
    </h3>
    <div class="row mb-10">
      <div
        v-if="value.cni"
        class="col span-4"
      >
        <Checkbox
          v-model:value="value.cni.enabled"
          :label="t('istio.cni')"
          @update:value="update"
        />
      </div>
      <div
        v-if="value.ingressGateways"
        class="col span-4"
      >
        <Checkbox
          v-model:value="value.ingressGateways.enabled"
          :label="t('istio.ingressGateway')"
        />
      </div>
      <div
        v-if="value.egressGateways"
        class="col span-4"
      >
        <Checkbox
          v-model:value="value.egressGateways.enabled"
          :label="t('istio.egressGateway')"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div
        v-if="value.pilot"
        class="col span-4"
      >
        <Checkbox
          v-model:value="value.pilot.enabled"
          :label="t('istio.pilot')"
          :disabled="value.kiali && value.kiali.enabled"
        />
      </div>
      <div
        v-if="value.policy"
        class="col span-4"
      >
        <Checkbox
          v-model:value="value.policy.enabled"
          :label="t('istio.policy')"
        />
      </div>
      <div
        v-if="value.telemetry"
        class="col span-4"
      >
        <Checkbox
          v-model:value="value.telemetry.enabled"
          :label="t('istio.telemetry')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div
        v-if="value.kiali"
        class="col span-4"
      >
        <Checkbox
          v-model:value="value.kiali.enabled"
          :label="t('istio.kiali')"
          @update:value="changeKiali"
        />
      </div>
      <div
        v-if="value.tracing"
        class="col span-4"
      >
        <Checkbox
          v-model:value="value.tracing.enabled"
          :label="t('istio.tracing')"
        />
      </div>
      <div class="col span-4" />
    </div>
    <div
      v-if="showKialiBanner"
      class="row"
    >
      <div class="col span-12">
        <Banner color="info">
          <span
            v-clean-html="t('istio.pilotRequired', {}, true)"
          />
        </Banner>
      </div>
    </div>

    <h3>{{ t('istio.customOverlayFile.label') }}</h3>
    <div class="custom-overlay">
      <Banner color="info">
        <span
          v-clean-html="t('istio.customOverlayFile.tip', {}, true)"
        />
      </Banner>
      <YamlEditor
        ref="yaml-editor"
        class="yaml-editor mb-10"
        :value="overlayFile"
        @onInput="valuesChanged"
      />
      <FileSelector
        class="role-primary  btn-sm"
        :label="t('generic.readFromFile')"
        @selected="onFileSelected"
      />
    </div>
  </div>
</template>

<style lang='scss'>
  $yaml-height: 200px;

  .custom-overlay {
    &>DIV{
      color: var(--input-label);
      &>*{
        padding: 3px;
      }
    }

    & .yaml-editor{
      flex: 1;
      min-height: $yaml-height;
      & .code-mirror .CodeMirror {
        position: initial;
        height: auto;
        min-height: $yaml-height;
      }
    }
  }
</style>
