<script>
import CodeMirror from './CodeMirror';
import AsyncButton from '@/components/AsyncButton';
import Footer from '@/components/form/Footer';
import { NAMESPACE } from '@/config/types';
import { _VIEW, _EDIT } from '@/config/query-params';
import { findBy } from '@/utils/array';

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
    let showYamlEditor = false;

    if (this.config && this.config.id) {
      gatekeeperEnabled = true;
    }

    if (this.mode === _EDIT) {
      showYamlEditor = true;
    }

    return {
      gatekeeperEnabled,
      showYamlEditor,
      errors:         [],
      saving:         false,
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

    parsedValuesYaml() {
      const yamlValues = this.config?.spec?.valuesYaml;
      let safeValues = null;

      try {
        safeValues = window.jsyaml.safeLoad(yamlValues);

        return safeValues;
      } catch (e) {
        console.error('Unable to parse Yaml Values', e);

        return {};
      }
    },
  },

  watch: {
    mode() {
      if (this.mode === _EDIT) {
        this.showYamlEditor = true;
      } else {
        this.showYamlEditor = false;
      }
    },
  },

  methods: {
    async ensureNamespace() {
      if ( findBy(this.namespaces, 'metadata.name', 'gatekeeper-system') ) {
        return;
      }

      const newSystemNs = await this.$store.dispatch('cluster/create', {
        type:        NAMESPACE,
        metadata:    {
          name:        'gatekeeper-system',
          annotations: { 'field.cattle.io/projectId': this.config.spec.projectName },
          labels:      { 'field.cattle.io/projectId': this.config.metadata.namespace },
        },
      });

      await newSystemNs.save();
      // TODO save doesnt push this object into the store it cerates a new one so waiting on a merge fucntion to be added to save before do this.
      // console.log('awaiting namespace');
      // await newSystemNs.waitForState('active');
    },

    showActions() {
      this.$store.commit('action-menu/show', {
        resources: this.config,
        elem:      this.$refs.actions,
      });
    },
    /**
     * Gets called when the user clicks on the button
     * Checks for the system namespace and creates that first if it does not exist
     * Creates gatekeeper app deployment
     *
     * @param {buttonCb} Callback to be called on success or fail
     */
    async enable(buttonCb) {
      try {
        await this.ensureNamespace();
        await this.config.save();
        // await this.config.waitForCondition('Installed');
        // console.log('awaiting app installed');
        this.gatekeeperEnabled = true;
        this.showYamlEditor = false;
        buttonCb(true);
      } catch (err) {
        this.gatekeeperEnabled = false;
        if (err?.message) {
          this.errors = [err.message];
        } else {
          this.errors = [err];
        }
        buttonCb(false);
      }

      this.saving = false;
    },

    /**
     * Gets called when the user selects advanced configuartion
     *
     */
    openYamlEditor() {
      if (this.showYamlEditor) {
        if (this.mode === _EDIT) {
          this.$router.push({ name: this.$route.name });
        } else {
          this.showYamlEditor = false;
        }
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
      try {
        await this.config.remove();

        this.gatekeeperEnabled = false;

        buttonCb(true);
      } catch (err) {
        this.errors = [err];

        buttonCb(false);
      }
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
    <header>
      <h1>
        OPA Gatekeeper
      </h1>
      <div v-if="gatekeeperEnabled" class="actions">
        <button ref="actions" type="button" class="btn btn-sm role-multi-action actions" @click="showActions">
          <i class="icon icon-actions" />
        </button>
      </div>
    </header>
    <div v-if="gatekeeperEnabled" class="mt-20">
      <div
        class="row info-box"
        v-if="!showYamlEditor"
      >
        <div class="col span-6">
          <div class="info-line">
            <label>Audit From Cache: </label>
            {{ parsedValuesYaml.auditFromCache }}
          </div>
          <div class="info-line">
            <label>Audit Interval: </label>
            {{ parsedValuesYaml.auditInterval }}s
          </div>
          <div class="info-line">
            <label>Constraint Violation Limit: </label>
            {{ parsedValuesYaml.constraintViolationsLimit }}
          </div>
          <div class="info-line">
            <label>Replicas: </label>
            {{ parsedValuesYaml.replicas }}
          </div>
          <div class="info-line">
            <label>Image: </label>
            {{ parsedValuesYaml.image.repository }}
          </div>
          <div class="info-line">
            <label>Version: </label>
            {{ parsedValuesYaml.image.release }}
          </div>
        </div>
        <div class="col span-6">
          <div class="info-line">
            <label>Image: </label>
            {{ parsedValuesYaml.image.repository }}
          </div>
          <div class="info-line">
            <label>Version: </label>
            {{ parsedValuesYaml.image.release }}
          </div>
        </div>
      </div>
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
            @click="enable"
          />
          <p>
            Enable Gatekeeper <span v-if="appVersion">({{ appVersion }}) </span>with defaults.
          </p>
        </div>
        <div class="col">
          <button
            type="button"
            class="btn bg-primary"
            :disable="saving"
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
        :mode="mode"
        @errors="errors"
        @save="enable"
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

 .info-box {
   background-color: var(--tabbed-container-bg);
   border: 1px solid var(--tabbed-border);
   padding: 20px;
   border-radius: var(--border-radius);
   .info-line {
     margin-bottom: 10px;
     label {
       color: var(--input-label);
     }
   }
 }
</style>
