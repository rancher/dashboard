<script>
import jsyaml from 'js-yaml';
import CodeMirror from './CodeMirror';
import AsyncButton from '@/components/AsyncButton';
import Footer from '@/components/form/Footer';
import InfoBox from '@/components/InfoBox';
import { NAMESPACE } from '@/config/types';
import { _VIEW, _EDIT } from '@/config/query-params';
import { findBy } from '@/utils/array';

export default {
  name: 'GatekeeperConfig',

  components: {
    AsyncButton,
    CodeMirror,
    InfoBox,
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
      const str = this.config?.spec?.valuesYaml;
      let values = null;

      try {
        values = jsyaml.safeLoad(str);

        return values;
      } catch (e) {
        console.error('Unable to parse valuesYaml', str, e); // eslint-disable-line no-console
      }

      return null;
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

    config: {
      deep: true,
      handler() {
        const gatekeeper = this.config || {};
        const meta = gatekeeper?.metadata;

        // this doesn't seeem right but the only way I can see to check that it was removed before the object goes away
        if (meta && Object.prototype.hasOwnProperty.call(meta, 'deletionTimestamp')) {
          this.gatekeeperEnabled = false;
          this.$emit('gatekeeperEnabled', this.gatekeeperEnabled);
        }

        if (!this.gatekeeperEnabled && this.saving && gatekeeper.hasCondition('Deployed', 'True')) { // we can get here if waitForCondition takes too long
          if (this.showYamlEditor) {
            this.showYamlEditor = false;
          }

          this.$emit('gatekeeperEnabled', this.gatekeeperEnabled = true);
        }
      }
    }
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
      await newSystemNs.waitForState('active');
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
        this.saving = true;
        await this.ensureNamespace();
        await this.config.save();
        await this.config.waitForCondition('Deployed');
        this.showYamlEditor = false;
        this.saving = false;
        this.$emit('gatekeeperEnabled', this.gatekeeperEnabled = true);
        buttonCb(true);
      } catch (err) {
        if (this?.config.hasCondition('Deployed', 'True')) { // we can hit this if waitForCondition above fails, in that case the config observer will enable
          buttonCb(true); // dont want to see red button error in this case
        } else {
          this.gatekeeperEnabled = false;
          this.saving = false;
          if (err?.message) {
            this.errors = [err.message];
          } else {
            this.errors = [err];
          }
          buttonCb(false);
        }
      }

      this.saving = false;
    },

    /**
     * Gets called when the user selects advanced configuration
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
  <div class="gatekeeper-config">
    <header>
      <h1>
        <t k="gatekeeperConfig.header" /> <span class="flag"><t k="gatekeeperConfig.flag" /></span>
      </h1>
      <div v-if="gatekeeperEnabled" class="actions">
        <button
          ref="actions"
          aria-haspopup="true"
          type="button"
          class="btn btn-sm role-multi-action actions"
          @click="showActions"
        >
          <i class="icon icon-actions" />
        </button>
      </div>
    </header>
    <div v-if="gatekeeperEnabled" class="mt-20">
      <InfoBox
        v-if="parsedValuesYaml && !showYamlEditor"
        class="row"
      >
        <div class="col span-6 info-column">
          <div class="info-row">
            <label><t k="gatekeeperConfig.infoBox.auditFromCache" />: </label>
            {{ parsedValuesYaml.auditFromCache }}
          </div>
          <div class="info-row">
            <label><t k="gatekeeperConfig.infoBox.auditInterval" />: </label>
            {{ parsedValuesYaml.auditInterval }}s
          </div>
          <div class="info-row">
            <label><t k="gatekeeperConfig.infoBox.constraintViolationsLimit" />: </label>
            {{ parsedValuesYaml.constraintViolationsLimit }}
          </div>
          <div class="info-row">
            <label><t k="gatekeeperConfig.infoBox.replicas" />: </label>
            {{ parsedValuesYaml.replicas }}
          </div>
        </div>
        <div class="col span-6 info-column">
          <div class="info-row">
            <label><t k="gatekeeperConfig.infoBox.imageRepository" />: </label>
            {{ parsedValuesYaml.image.repository }}
          </div>
          <div class="info-row">
            <label><t k="gatekeeperConfig.infoBox.imageTag" />: </label>
            {{ parsedValuesYaml.image.tag }}
          </div>
        </div>
      </InfoBox>
    </div>
    <div v-else class="mt-20 mb-20">
      <div class="row">
        <div class="col span-6">
          <h3><t k="gatekeeperConfig.configure.description" /></h3>
          <ul>
            <li><t k="gatekeeperConfig.configure.helpText.listItem1" /></li>
            <li><t k="gatekeeperConfig.configure.helpText.listItem2" /></li>
            <li><t k="gatekeeperConfig.configure.helpText.listItem3" /> <a href="https://www.openpolicyagent.org/docs/latest/kubernetes-introduction/" target="blank"><t k="gatekeeperConfig.configure.helpText.listItem4" /></a></li>
          </ul>
        </div>
        <div class="col span-6">
          <h3><t k="gatekeeperConfig.configure.requirements.header" /></h3>
          <ul>
            <li><t k="gatekeeperConfig.configure.requirements.helpText.listItem1" /></li>
            <li><t k="gatekeeperConfig.configure.requirements.helpText.listItem2" /></li>
          </ul>
        </div>
      </div>
      <div>
        <div class="spacer"></div>
        <div v-if="!showYamlEditor" class="text-center">
          <button
            type="button"
            class="btn role-secondary"
            :class="{ disabled: saving }"
            :disable="saving"
            @click="openYamlEditor"
          >
            <t k="generic.customize" />
          </button>
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
        </div>
      </div>
    </div>
    <section v-if="showYamlEditor">
      <CodeMirror
        class="code-mirror"
        :value="config.spec.valuesYaml"
        :options="cmOptions"
        @onInput="onInput"
        @onReady="onReady"
        @onChanges="onChanges"
      />
      <Footer
        create-action-label="Enable"
        create-waiting-label="Enabling"
        create-success-label="Enabled"
        create-error-label="Error enabling"
        :mode="mode"
        @errors="errors"
        @save="enable"
        @done="openYamlEditor"
      />
    </section>
  </div>
</template>

<style lang="scss">
.gatekeeper-config {
  .code-mirror {
    min-height: 200px;
  }
}

h1 {
  .flag {
    text-align: center;
    display: inline-block;
    vertical-align: middle;
    background: var(--warning);
    font-size: 10px;
    padding: 0 0 0 10px;
    border-radius: 2px 0 0 2px;

    &:after {
      content: "";
      display: inline-block;
      vertical-align: middle;
      position: relative;
      right: -10px;
      height: 100%;
      border-width: 10px;
      border-style: solid;
      border-color: var(--warning) transparent var(--warning) var(--warning);
    }
  }
}
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
</style>
