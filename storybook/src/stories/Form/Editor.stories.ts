import type { Meta, StoryObj } from '@storybook/vue3';
import CodeMirror from '@shell/components/CodeMirror';

const meta: Meta<typeof CodeMirror> = {
  component: CodeMirror,
  argTypes:  {
    value:         { control: 'text' },
    mode:          { control: 'text' },
    options:       { control: 'object' },
    asTextArea:    { control: 'boolean' },
    showKeyMapBox: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof CodeMirror>;

export const editorValueExample = `{
  apiVersion: provisioning.cattle.io/v1
kind: Cluster
metadata:
  name: #string
  annotations:
    {}
  labels:
    {}
  namespace: fleet-default
spec:
  clusterAgentDeploymentCustomization:
    appendTolerations:
    overrideAffinity:
  defaultPodSecurityAdmissionConfigurationTemplateName: ''
  defaultPodSecurityPolicyTemplateName: ''
  fleetAgentDeploymentCustomization:
    overrideResourceRequirements:
  kubernetesVersion: v1.26.6+rke2r1
  localClusterAuthEndpoint:
    caCerts: ''
    enabled: false
    fqdn: ''
  rkeConfig:
    chartValues:
      rke2-calico: {}
    etcd:
      disableSnapshots: false
      s3:
      snapshotRetention: 5
      snapshotScheduleCron: 0 */5 * * *
    machineGlobalConfig:
      cni: calico
      disable-kube-proxy: false
      etcd-expose-metrics: false
      profile: null
    machinePools:
    machineSelectorConfig:
      - config:
          protect-kernel-defaults: false
    registries:
      configs:
        {}
        #  authConfigSecretName: string
      mirrors:
        {}
        #  endpoint:
    upgradeStrategy:
      controlPlaneConcurrency: '1'
      controlPlaneDrainOptions:
        deleteEmptyDirData: true
        disableEviction: false
        enabled: false
        force: false
        gracePeriod: -1
        ignoreDaemonSets: true
        skipWaitForDeleteTimeoutSeconds: 0
        timeout: 120
      workerConcurrency: '1'
      workerDrainOptions:
        deleteEmptyDirData: true
        disableEviction: false
        enabled: false
        force: false
        gracePeriod: -1
        ignoreDaemonSets: true
        skipWaitForDeleteTimeoutSeconds: 0
        timeout: 120
  machineSelectorConfig:
    - config: {}
__clone: true
}`;

export const Default: Story = {
  render: (args: any) => ({
    components: { CodeMirror },
    setup() {
      return { args };
    },
    template: '<CodeMirror v-bind="args" />',
  }),
};

export const Yaml: Story = {
  ...Default,
  args: {
    value:         editorValueExample,
    mode:          'edit',
    options:       {},
    asTextArea:    false,
    showKeyMapBox: true,
  },
};

export const Textarea: Story = {
  ...Default,
  args: {
    value: `
Some
values
    `,
    mode:          'edit',
    options:       {},
    asTextArea:    true,
    showKeyMapBox: true,
  },
};
