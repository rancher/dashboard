<script>
import CodeMirror from './CodeMirror';
import AsyncButton from '@/components/AsyncButton';
import Footer from '@/components/form/Footer';
import { NAMESPACE } from '@/config/types';
import { _VIEW } from '@/config/query-params';

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

    /**
     * Page mode
     * @values view, create
     */
    mode: {
      type:    String,
      default: null,
    },

    /**
     * All namespaces
     */
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
    appVersion() {
      const externalId = this.config?.spec?.externalId;

      if (!externalId) {
        return null;
      }

      const version = externalId.split('&').find(e => e.includes('version')).split('=').pop() || null;

      return version;
    },
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
      const readOnly = this.mode === _VIEW;
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
    /**
     * Gets called when the user clicks on the button
     * Checks for the system namespace and creates that first if it does not exist
     * Creates gatekeeper app deployment
     *
     * @param {buttonCb} Callback to be called on success or fail
     */
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
          apiVersion:  'v1',
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

    /**
     * Gets called when the user selects advanced configuartion
     *
     */
    openYamlEditor() {
      if (this.showYamlEditor) {
        this.showYamlEditor = false;
      } else {
        this.showYamlEditor = true;
      }
    },

    /**
     * Gets called when the user clicks on the disable button
     *
     * @param {buttonCb} Callback to be called on success or fail
     */
    async disable(buttonCb) {
      await this.config.remove();

      this.gatekeeperEnabled = false;

      buttonCb(true);
    },

    /**
     * An event handler that will be called whenever keydown fires in the CodeMirror input.
     *
     * @param {value} Yaml string
     */
    onInput(value) {
      this.config.spec.valuesYaml = value;
    },

    /**
     * Gets called when CodeMirror is ready and folds
     *
     */
    onReady(cm) {
      cm.getMode().fold = 'yaml';

      cm.execCommand('foldAll');
    },

    /**
     * An event handler that will be called whenever CodeMirror onChange event fires.
     *
     * @param {cm} CodeMirror instance
     * @param {changes} Changes from CodeMirror
     */
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
    <header class="opa-header">
      <div class="opa-logo"></div>
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
    <div v-else class="mt-20 mb-20">
      <hr />
      <article class="col span-12 info">
        <p>
          Every organization has policies. Some are essential to meet governance and legal requirements. Others help ensure adherance to best practices and institutional conventions. Attempting to ensure compliance manually would be error-prone and frustrating. Automating policy enforcement ensures consistency, lowers development latency through immediate feedback, and helps with agility by allowing developers to operate independently without sacrificing compliance.
        </p>
        <p>
          Kubernetes allows decoupling policy decisions from the inner workings of the API Server by means of admission controller webhooks, which are executed whenever a resource is created, updated or deleted. Gatekeeper is a validating (mutating TBA) webhook that enforces CRD-based policies executed by Open Policy Agent, a policy engine for Cloud Native environments hosted by CNCF as an incubation-level project.
        </p>
        <p>
          In addition to the admission scenario, Gatekeeper's audit functionality allows administrators to see what resources are currently violating any given policy.
        </p>
        <p>
          Finally, Gatekeeper's engine is designed to be portable, allowing administrators to detect and reject non-compliant commits to an infrastructure-as-code system's source-of-truth, further strengthening compliance efforts and preventing bad state from slowing down the organization.
        </p>
      </article>
      <hr />
      <div class="row action-group">
        <div class="col">
          <AsyncButton
            :mode="mode"
            action-label="Enable"
            waiting-label="Enabling"
            success-label="Enabled"
            error-label="Error enabling"
            :disabled="showYamlEditor"
            v-bind="$attrs"
            @click="clicked"
          />
          <p>
            Enable Gatekeeper <span v-if="appVersion">({{ appVersion }}) </span>with deafults.
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
 article {
   font-size: .8em;
   &.info {
     padding: 10px 0;

     p {
       padding-bottom: 16px;
     }
   }
 }
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
 .opa-logo {
   background-color: var(--header-logo);
   display: inline-block;
   height: 50px;
   mask: url("~assets/images/opa-logo.svg") no-repeat center;
 }
 .opa-header {
   display: grid;
   grid-template-areas: "logo title actions";
   grid-template-columns: 64px auto min-content;
 }
</style>
