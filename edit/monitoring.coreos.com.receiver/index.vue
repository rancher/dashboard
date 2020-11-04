<script>
import { MONITORING } from '@/config/types';
import ArrayList from '@/components/form/ArrayList';
import Loading from '@/components/Loading';
import Banner from '@/components/Banner';
import CruResource from '@/components/CruResource';
import GradientBox from '@/components/GradientBox';
import LabeledInput from '@/components/form/LabeledInput';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import InfoBox from '@/components/InfoBox';
import YamlEditor, { EDITOR_MODES } from '@/components/YamlEditor';
import CreateEditView from '@/mixins/create-edit-view';
import { defaultAsyncData } from '@/components/ResourceDetail';
import jsyaml from 'js-yaml';
import { RECEIVERS_TYPES } from '@/models/monitoring.coreos.com.receiver';

export default {
  components: {
    ArrayList, Banner, CruResource, GradientBox, InfoBox, LabeledInput, Loading, Tabbed, Tab, YamlEditor
  },
  mixins: [CreateEditView],
  asyncData(ctx) {
    function yamlSave(value, originalValue) {
      originalValue.yamlSaveOverride(value, originalValue);
    }

    return defaultAsyncData(ctx, null, {
      hideBanner: true, hideAge: true, hideBadgeState: true, yamlSave
    });
  },
  data() {
    this.$set(this.value, 'spec', this.value.spec || {});

    RECEIVERS_TYPES.forEach((receiverType) => {
      this.$set(this.value.spec, receiverType.key, this.value.spec[receiverType.key] || []);
    });

    const specSchema = this.$store.getters['cluster/schemaFor'](MONITORING.SPOOFED.RECEIVER_SPEC);
    const expectedFields = Object.keys(specSchema.resourceFields);
    const suffix = {};

    Object.keys(this.value.spec).forEach((key) => {
      if (!expectedFields.includes(key)) {
        suffix[key] = this.value.spec[key];
      }
    });

    let suffixYaml = jsyaml.safeDump(suffix);

    if (suffixYaml.trim() === '{}') {
      suffixYaml = '';
    }

    return {
      expectedFields,
      receiverTypes:    RECEIVERS_TYPES,
      fileFound:        false,
      receiver:         {},
      suffixYaml,
      EDITOR_MODES,
      yamlSaveOverride: this.yamlSaveOverride
    };
  },
  computed: {
    editorMode() {
      if ( this.isView ) {
        return EDITOR_MODES.VIEW_CODE;
      }

      return EDITOR_MODES.EDIT_CODE;
    },
  },
  watch: {
    suffixYaml(value) {
      try {
        // We need this step so we don't just keep adding new keys when modifying the custom field
        Object.keys(this.value.spec).forEach((key) => {
          if (!this.expectedFields.includes(key)) {
            this.$delete(this.value.spec, key);
          }
        });

        const suffix = jsyaml.safeLoad(value);

        Object.assign(this.value.spec, suffix);
      } catch (ex) {}
    }
  },
  methods: {
    getComponent(name) {
      return require(`./types/${ name }`).default;
    },

    navigateTo(receiverType) {
      this.$refs.tabbed.select(receiverType.name);
    },

    getCount(receiverType) {
      const found = this.value?.spec?.[receiverType.key] || [];

      return found.length;
    },
    tabChanged({ tab }) {
      window.scrollTop = 0;
      if ( tab.name === 'custom' ) {
        this.$nextTick(() => {
          if ( this.$refs.customEditor ) {
            this.$refs.customEditor[0].refresh();
            this.$refs.customEditor[0].focus();
          }
        });
      }
    },
  }
};
</script>

<template>
  <CruResource
    class="receiver"
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :errors="errors"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <div v-if="!isView" class="row mb-10">
      <div class="col span-6">
        <LabeledInput v-model="value.spec.name" :disabled="!isCreate" :label="t('generic.name')" :mode="mode" />
      </div>
    </div>
    <Tabbed ref="tabbed" :side-tabs="true" default-tab="overview" @changed="tabChanged">
      <Tab :label="t('generic.overview')" :weight="receiverTypes.length" name="overview">
        <div class="box-container">
          <GradientBox v-for="(receiverType, i) in receiverTypes" :key="i" class="mb-10" primary-color-var="--primary-color" @click.native="navigateTo(receiverType)">
            <div class="gradient-container">
              <div class="left">
                <div class="logo">
                  <img :src="receiverType.logo" />
                </div>
                <h4 class="name ml-10">
                  {{ receiverType.label }}
                </h4>
              </div>
              <div v-if="receiverType.name !== 'custom'" class="right">
                {{ getCount(receiverType) }}
              </div>
            </div>
          </GradientBox>
        </div>
      </Tab>
      <Tab v-for="(receiverType, i) in receiverTypes" :key="i" :label="receiverType.label" :name="receiverType.name" :weight="receiverTypes.length - i">
        <Banner v-if="receiverType.name === 'slack'" color="info">
          Here's how you create <a href="https://rancher.slack.com/apps/A0F7XDUAZ-incoming-webhooks" target="_blank" rel="noopener noreferrer nofollow">Incoming Webhooks</a> for Slack.
        </Banner>
        <Banner v-if="receiverType.name === 'custom'" color="info" label="The YAML provided here will be directly appended to your receiver within the Alertmanager Config Secret" />
        <div class="provider mb-10">
          <h1>
            {{ receiverType.title }}
          </h1>
        </div>
        <YamlEditor
          v-if="receiverType.name === 'custom'"
          ref="customEditor"
          v-model="suffixYaml"
          :scrolling="false"
          :editor-mode="editorMode"
        />
        <ArrayList
          v-else
          v-model="value.spec[receiverType.key]"
          class="namespace-list"
          :mode="mode"
          :default-add-value="{}"
          :add-label="'Add ' + receiverType.label"
        >
          <template v-slot:columns="scope">
            <InfoBox class="pt-40">
              <component :is="getComponent(receiverType.name)" :value="scope.row.value" :mode="mode" />
            </InfoBox>
          </template>
          <template v-slot:remove-button="scope">
            <button class="btn role-link close" @click="scope.remove">
              <i class="icon icon-2x icon-x" />
            </button>
          </template>
        </ArrayList>
      </Tab>
    </Tabbed>
  </CruResource>
</template>

<style lang="scss">
  .receiver {
    $margin: 10px;
    $logo: 60px;

    .box-container {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      margin: 0 -1*$margin;

      .gradient-box {
        width: calc(50% - 2 * #{$margin});
      }
    }

    .gradient-box {
      padding: $margin;
      position: relative;
      border-radius: calc( 1.5 * var(--border-radius));
      cursor: pointer;

      .gradient-container {
        height: 76px;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
      }
    }

    .right {
      padding: 30px;
      border-left: 1px solid var(--border);
    }

    .logo {
      text-align: center;
      width: $logo;
      height: $logo;
      border-radius: calc(2 * var(--border-radius));
      overflow: hidden;
      background-color: white;
      display: inline-block;
      vertical-align: middle;

      img {
        width: $logo - 4px;
        height: $logo - 4px;
        object-fit: contain;
        position: relative;
        top: 2px;
      }
    }

    .name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 0;
      display: inline-block;
      vertical-align: middle;
    }

    .box {
      position: relative;
    }

    .remove {
      position: absolute;

      padding: 0px;

      top: 0;
      right: 0;
    }
  }
</style>
