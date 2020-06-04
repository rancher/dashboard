<script>
import jsyaml from 'js-yaml';
import YamlEditor from '@/components/YamlEditor';
import AsyncButton from '@/components/AsyncButton';
import Footer from '@/components/form/Footer';
import { NAMESPACE } from '@/config/types';
import { _EDIT } from '@/config/query-params';
import { findBy } from '@/utils/array';

export default {
  name: 'RioConfig',

  components: {
    AsyncButton,
    YamlEditor,
    Footer,
  },

  props: {
    /**
     * The rio config if enabled.
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
    let rioEnabled = false;
    let showYamlEditor = false;

    if (this.config && this.config.id) {
      rioEnabled = true;
    }

    if (this.mode === _EDIT) {
      showYamlEditor = true;
    }

    return {
      rioEnabled,
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

    rioSystemNamespace() {
      const { namespaces } = this;

      return namespaces.find(ns => ns.metadata.name === 'rio-system');
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
        const rio = this.config || {};
        const meta = rio?.metadata;

        // this doesn't seeem right but the only way I can see to check that it was removed before the object goes away
        if (meta && Object.prototype.hasOwnProperty.call(meta, 'deletionTimestamp')) {
          this.rioEnabled = false;
          this.$emit('rioEnabled', this.rioEnabled);
        }

        if (!this.rioEnabled && this.saving && rio.hasCondition('Deployed', 'True')) { // we can get here if waitForCondition takes too long
          if (this.showYamlEditor) {
            this.showYamlEditor = false;
          }

          this.$emit('rioEnabled', this.rioEnabled = true);
        }
      }
    }
  },

  methods: {
    async ensureNamespace() {
      if ( findBy(this.namespaces, 'metadata.name', 'rio-system') ) {
        return;
      }

      const newSystemNs = await this.$store.dispatch('cluster/create', {
        type:        NAMESPACE,
        metadata:    {
          name:        'rio-system',
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
     * Creates rio app deployment
     *
     * @param {buttonCb} Callback to be called on success or fail
     */
    async enableRio(buttonCb) {
      try {
        this.saving = true;
        await this.ensureNamespace();
        await this.config.save();
        await this.config.waitForCondition('Deployed');
        this.showYamlEditor = false;
        this.saving = false;
        this.$emit('rioEnabled', this.rioEnabled = true);
        buttonCb(true);
      } catch (err) {
        if (this?.config.hasCondition('Deployed', 'True')) { // we can hit this if waitForCondition above fails, in that case the config observer will enable
          buttonCb(true); // dont want to see red button error in this case
        } else {
          this.rioEnabled = false;
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

        this.rioEnabled = false;

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
      cm.getMode().fold = 'yamlcomments';

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
  <div class="rio-config">
    <header>
      <h1>
        <t k="rioConfig.header" />
      </h1>
      <div v-if="rioEnabled" class="actions">
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
    <div v-if="rioEnabled" class="mt-20">
      Rio is Enabled
    </div>
    <div v-else class="mt-20 mb-20">
      <div class="row">
        <div class="col span-6">
          <h3><t k="rioConfig.configure.description" /></h3>
          <ul>
            <li><t k="rioConfig.configure.helpText.listItem1" /></li>
            <li><t k="rioConfig.configure.helpText.listItem2" /></li>
          </ul>
        </div>
        <div class="col span-6">
          <h3><t k="rioConfig.configure.requirements.header" /></h3>
          <ul>
            <li><t k="rioConfig.configure.requirements.helpText.listItem1" /></li>
            <li><t k="rioConfig.configure.requirements.helpText.listItem2" /></li>
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
            mode="enable"
            :disabled="showYamlEditor"
            v-bind="$attrs"
            @click="enableRio"
          />
        </div>
      </div>
    </div>
    <section v-if="showYamlEditor">
      <YamlEditor
        class="code-mirror"
        :value="config.spec.valuesYaml"
        @onInput="onInput"
        @onReady="onReady"
        @onChanges="onChanges"
      />
      <Footer
        mode="enable"
        @errors="errors"
        @save="enableRio"
        @done="openYamlEditor"
      />
    </section>
  </div>
</template>

<style lang="scss">
.rio-config {
  .code-mirror {
    min-height: 200px;
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
