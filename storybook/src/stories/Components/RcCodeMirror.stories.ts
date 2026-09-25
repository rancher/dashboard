import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import type { EditorView } from '@codemirror/view';
import {
  RcCodeMirror, foldByLineMatch, foldByYamlPath, foldMatchingLines, foldYamlPath
} from '@components/RcCodeMirror';

const yaml = `# Kubernetes Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
  namespace: default
  annotations:
    owner: 'platform'
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: nginx:1.21
          stdin: true
          ports:
            - containerPort: 80
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 256Mi
`;

const json = JSON.stringify({
  name:     'nginx',
  replicas: 3,
  ports:    [80, 443],
  config:   {
    lineNumbers:  true,
    foldGutter:   true,
    lineWrapping: false
  }
}, null, 2);

const meta: Meta<typeof RcCodeMirror> = {
  component: RcCodeMirror,
  argTypes:  {
    language: {
      options:     ['yaml', 'json'],
      control:     { type: 'select' },
      description: 'Syntax highlighting and language-aware folding for the document.'
    },
    keymap: {
      options:     ['default', 'vim', 'emacs'],
      control:     { type: 'select' },
      description: 'Key bindings used by the editor.'
    },
    theme: {
      options:     ['rancher', 'none'],
      control:     { type: 'select' },
      description: 'Editor color theme. `rancher` follows the surrounding light or dark theme; `none` inherits the surrounding styles.'
    },
    variant: {
      options:     ['editor', 'input'],
      control:     { type: 'select' },
      description: '`editor` is a code editor with gutters. `input` is a multi-line form input that preserves whitespace, without gutters, always wrapping and with line breaks marked.'
    },
    readOnly:     { control: 'boolean', description: 'Prevents the document from being edited.' },
    lineNumbers:  { control: 'boolean', description: 'Shows the line number gutter.' },
    foldGutter:   { control: 'boolean', description: 'Shows the fold gutter. Folding still works from the keyboard and the fold helpers when it is hidden.' },
    lineWrapping: { control: 'boolean', description: 'Wraps long lines instead of scrolling horizontally.' },
    foldOptions:  {
      control:     'object',
      description: 'Fold strategy (`language`, `indent` or `bracket`) plus an optional custom fold extension. Only read on mount.'
    },
    extensions: {
      control:     false,
      description: 'Additional CodeMirror extensions appended to the editor. Only read on mount.'
    },
  },
  args: {
    language:     'yaml',
    keymap:       'default',
    theme:        'rancher',
    variant:      'editor',
    readOnly:     false,
    lineNumbers:  true,
    foldGutter:   true,
    lineWrapping: false,
  },
};

export default meta;
type Story = StoryObj<typeof RcCodeMirror>;

export const Default: Story = {
  render: (args: any) => ({
    components: { RcCodeMirror },
    setup() {
      const value = ref(args.language === 'json' ? json : yaml);

      return { args, value };
    },
    template: `
      <div style="height: 400px;">
        <RcCodeMirror v-bind="args" v-model="value" aria-label="Deployment" />
      </div>
    `,
  }),
};

export const ForwardedStyle: Story = {
  render: (args: any) => ({
    components: { RcCodeMirror },
    setup() {
      const value = ref(yaml);

      return { args, value };
    },
    template: `
      <RcCodeMirror
        v-bind="args"
        v-model="value"
        aria-label="Deployment"
        style="width: 500px; height: 240px; margin: 16px; padding: 8px; border: 2px solid #737373;"
      />
    `,
  }),
};

export const Json: Story = {
  ...Default,
  args: { language: 'json' },
};

export const ReadOnly: Story = {
  ...Default,
  args: { readOnly: true },
};

export const CustomFolding: Story = {
  render: (args: any) => ({
    components: { RcCodeMirror },
    setup() {
      const value = ref(yaml);
      const extensions = [
        foldByLineMatch(/^spec:\s*$/),
        foldByYamlPath('metadata.labels')
      ];

      function onReady(view: EditorView) {
        foldMatchingLines(view, /^spec:\s*$/);
        foldYamlPath(view, 'metadata.labels');
      }

      return {
        args, value, extensions, onReady
      };
    },
    template: `
      <div style="height: 400px;">
        <RcCodeMirror v-bind="args" v-model="value" aria-label="Deployment" :extensions="extensions" @ready="onReady" />
      </div>
    `,
  }),
  args: { foldOptions: { strategy: 'indent' } },
};

export const VModel: Story = {
  render: (args: any) => ({
    components: { RcCodeMirror },
    setup() {
      const value = ref(yaml);

      return { args, value };
    },
    template: `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; height: 400px;">
        <RcCodeMirror v-bind="args" v-model="value" aria-label="Deployment" />
        <pre style="margin: 0; overflow: auto;">{{ value }}</pre>
      </div>
    `,
  }),
};

const inputYaml = 'enabled: true\nowner: "platform"\n# a comment';
const certificate = '-----BEGIN CERTIFICATE-----\nMIIBeTCCAR+gAwIBAgIBADAKBggqhkjOPQQDAjAkMSIwIAYDVQQDDBlya2UyLXNl\n-----END CERTIFICATE-----';

export const Input: Story = {
  render: (args: any) => ({
    components: { RcCodeMirror },
    setup() {
      const value = ref(args.language === 'yaml' ? inputYaml : certificate);

      return { args, value };
    },
    template: `
      <div style="width: 400px;">
        <label id="certificate-label">Certificate</label>
        <RcCodeMirror v-bind="args" v-model="value" aria-labelledby="certificate-label" />
      </div>
    `,
  }),
  args: {
    variant:  'input',
    language: undefined,
  },
};

export const InputYaml: Story = {
  ...Input,
  args: {
    variant:  'input',
    language: 'yaml',
  },
};
