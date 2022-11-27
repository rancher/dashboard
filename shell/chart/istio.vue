<script>
import debounce from 'lodash/debounce';
import jsyaml from 'js-yaml';
import { Checkbox } from '@components/Form/Checkbox';
import YamlEditor from '@shell/components/YamlEditor';
import { mapGetters } from 'vuex';
import FileSelector from '@shell/components/form/FileSelector';
import Tab from '@shell/components/Tabbed/Tab';
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
  components: {
    Checkbox,
    FileSelector,
    YamlEditor,
    Tab,
    Banner
  },

  hasTabs: true,

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

    return { overlayFile };
  },

  computed: {
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

    ...mapGetters({ t: 'i18n/t' })
  },

  methods: {
    update() {
      this.$emit('input', this.value);
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
    }
  }
};
</script>

<template>
  <div>
    <Tab
      name="components"
      :label="t('istio.titles.components') "
    >
      <div class="row">
        <div
          v-if="value.cni"
          class="col span-4"
        >
          <Checkbox
            v-model="value.cni.enabled"
            :label="t('istio.cni')"
            @input="update"
          />
        </div>
        <div
          v-if="value.ingressGateways"
          class="col span-4"
        >
          <Checkbox
            v-model="value.ingressGateways.enabled"
            :label="t('istio.ingressGateway')"
          />
        </div>
        <div
          v-if="value.egressGateways"
          class="col span-4"
        >
          <Checkbox
            v-model="value.egressGateways.enabled"
            :label="t('istio.egressGateway')"
          />
        </div>
      </div>
      <div class="row">
        <div
          v-if="value.pilot"
          class="col span-4"
        >
          <Checkbox
            v-model="value.pilot.enabled"
            :label="t('istio.pilot')"
          />
        </div>
        <div
          v-if="value.policy"
          class="col span-4"
        >
          <Checkbox
            v-model="value.policy.enabled"
            :label="t('istio.policy')"
          />
        </div>
        <div
          v-if="value.telemetry"
          class="col span-4"
        >
          <Checkbox
            v-model="value.telemetry.enabled"
            :label="t('istio.telemetry')"
          />
        </div>
      </div>
      <div class="row">
        <div
          v-if="value.kiali"
          class="col span-4"
        >
          <Checkbox
            v-model="value.kiali.enabled"
            :label="t('istio.kiali')"
          />
        </div>
        <div
          v-if="value.tracing"
          class="col span-4"
        >
          <Checkbox
            v-model="value.tracing.enabled"
            :label="t('istio.tracing')"
          />
        </div>
        <div class="col span-4" />
      </div>
    </Tab>

    <Tab
      :label="t('istio.customOverlayFile.label')"
      name="overlay"
      @active="$refs['yaml-editor'].refresh()"
    >
      <div class="custom-overlay">
        <Banner color="info">
          <span
            v-html="t('istio.customOverlayFile.tip', {}, true)"
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
    </Tab>
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
