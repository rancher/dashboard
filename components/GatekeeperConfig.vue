<script>
import CodeMirror from './CodeMirror';
import AsyncButton from '@/components/AsyncButton';
import Footer from '@/components/form/Footer';
import { NAMESPACE } from '@/config/types';

export default {
  name: 'GatekeeperConfig',

  components: {
    AsyncButton,
    CodeMirror,
    Footer,
  },

  props: {
    /**
     * The gatekeeper config if enabled.
     * @model
     */
    config: {
      type:    Object,
      default: null,
    },

    mode: {
      type:    String,
      default: null,
    },

    namespaces: {
      type:    Array,
      default: null,
    },
  },

  data() {
    let gatekeeperEnabled = false;

    if (this.config && this.config.id) {
      gatekeeperEnabled = true;
    }

    return {
      gatekeeperEnabled,
      showYamlEditor: false,
      errors:         null,
    };
  },

  computed: {
    gatekeeperSystemNamespace() {
      const { namespaces } = this;

      return namespaces.find(ns => ns.metadata.name === 'gatekeeper-system');
    },

    systemNamespaceExists() {
      const match = this.gatekeeperSystemNamespace;

      if (match) {
        return true;
      }

      return false;
    },

    cmOptions() {
      const readOnly = false; // this.mode === _VIEW;
      const gutters = ['CodeMirror-lint-markers'];

      if ( !readOnly ) {
        gutters.push('CodeMirror-foldgutter');
      }

      return {
        readOnly,
        gutters,
        mode:            'yaml',
        lint:            true,
        lineNumbers:     !readOnly,
        extraKeys:       { 'Ctrl-Space': 'autocomplete' },
        cursorBlinkRate: ( readOnly ? -1 : 530)
      };
    },
  },

  methods: {
    async clicked(buttonCb) {
      if (this.systemNamespaceExists) {
        try {
          await this.config.save();
        } catch (err) {
          this.gatekeeperEnabled = false;
          buttonCb(false, err);
        }

        this.gatekeeperEnabled = true;
        this.showYamlEditor = false;
        buttonCb(true);
      } else {
        const newSystemNs = await this.$store.dispatch('cluster/create', {
          type:        NAMESPACE,
          kind:        'Namespace',
          apiVersion:  'v1', // `${ hash.schema.attributes.group }/${ hash.schema.attributes.version }`,
          metadata:    {
            name:        'gatekeeper-system',
            annotations: { 'field.cattle.io/projectId': this.config.spec.projectName },
            labels:      { 'field.cattle.io/projectId': this.config.metadata.namespace },
          },
        });

        try {
          await newSystemNs.save();
        } catch (err) {
          this.gatekeeperEnabled = false;
          buttonCb(false, err);
        }

        try {
          await this.config.save();
        } catch (err) {
          this.gatekeeperEnabled = false;
          buttonCb(false, err);
        }

        this.gatekeeperEnabled = true;
        this.showYamlEditor = false;
        buttonCb(true);
      }
    },

    openYamlEditor() {
      if (this.showYamlEditor) {
        this.showYamlEditor = false;
      } else {
        this.showYamlEditor = true;
      }
    },

    async disable(buttonCb) {
      await this.config.remove();

      this.gatekeeperEnabled = false;

      buttonCb(true);
    },

    onInput(value) {
      this.config.spec.valuesYaml = value;
    },

    onReady(cm) {
      cm.getMode().fold = 'yaml';

      cm.execCommand('foldAll');
    },

    onChanges(cm, changes) {
      if ( changes.length !== 1 ) {
        return;
      }

      const change = changes[0];

      if ( change.from.line !== change.to.line ) {
        return;
      }

      let line = change.from.line;
      let str = cm.getLine(line);
      let maxIndent = indentChars(str);

      if ( maxIndent === null ) {
        return;
      }

      cm.replaceRange('', { line, ch: 0 }, { line, ch: 1 }, '+input');

      while ( line > 0 ) {
        line--;
        str = cm.getLine(line);
        const indent = indentChars(str);

        if ( indent === null ) {
          break;
        }

        if ( indent < maxIndent ) {
          cm.replaceRange('', { line, ch: 0 }, { line, ch: 1 }, '+input');

          if ( indent === 0 ) {
            break;
          }

          maxIndent = indent;
        }
      }

      function indentChars(str) {
        const match = str.match(/^#(\s+)/);

        if ( match ) {
          return match[1].length;
        }

        return null;
      }
    },
  },
};
</script>

<template>
  <div>
    <header>
      <h1>
        OPA + Gatekeeper
      </h1>
      <div v-if="gatekeeperEnabled" class="actions">
        <AsyncButton
          :mode="mode"
          action-label="Disable Gatekeeper"
          waiting-label="Disabling"
          success-label="Disabled"
          error-label="Error disabled"
          v-bind="$attrs"
          @click="disable"
        />
      </div>
    </header>
    <div v-if="gatekeeperEnabled" class="mt-20 text-center">
      <h3>
        Gatekeeper is enabled.
      </h3>
    </div>
    <div v-else class="row action-group mt-20 mb-20">
      <div class="col">
        <AsyncButton
          :mode="mode"
          action-label="Enable With Defaults"
          waiting-label="Enabling"
          success-label="Enabled"
          error-label="Error enabling"
          :disabled="showYamlEditor"
          v-bind="$attrs"
          @click="clicked"
        />
        <p>
          Enable Gatekeeper with deafult configuartion.
        </p>
      </div>
      <div class="col">
        <button
          type="button"
          class="btn bg-primary"
          @click="openYamlEditor"
        >
          Customize Configuration
        </button>
        <p>
          Customize Gatekeeper yaml configuartion.
        </p>
      </div>
    </div>
    <section v-if="showYamlEditor">
      <CodeMirror
        :value="config.spec.valuesYaml"
        :options="cmOptions"
        :footer-space="71"
        @onInput="onInput"
        @onReady="onReady"
        @onChanges="onChanges"
      />
      <Footer
        mode="create"
        @save="clicked"
        @done="openYamlEditor"
      />
    </section>
  </div>
</template>

<style lang="scss">
 .action-group {
   padding-top: 20px;
   .col {
     text-align: center;
     flex: 1 1;
   }
   .col:first-of-type {
     border-right: 1px solid;
   }
 }
</style>
