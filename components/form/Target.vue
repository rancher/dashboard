<script>
import { findBy } from '@/utils/array';
import { cleanUp } from '@/utils/object';
import Loading from '@/components/Loading';
import CreateEditView from '@/mixins/create-edit-view';
import { RIO } from '@/config/types';
import { groupAndFilterOptions } from '@/utils/group';
import { allHash } from '@/utils/promise';
import Checkbox from '@/components/form/Checkbox';
import LabeledSelect from '@/components/form/LabeledSelect';

const KIND_LABELS = {
  router:  'A router',
  app:     'A service',
};

export default {
  components: {
    Loading, Checkbox, LabeledSelect
  },
  mixins:     [CreateEditView],
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    kindLabels: {
      type:    Object,
      default: KIND_LABELS
    }
  },

  async fetch() {
    const hash = await allHash({
      services: this.$store.dispatch('cluster/findAll', { type: RIO.SERVICE }),
      routers:  this.$store.dispatch('cluster/findAll', { type: RIO.ROUTER }),
    });

    this.allServices = hash.services;
    this.allRouters = hash.routers;
  },

  data() {
    const spec = this.value;

    let kind, targetApp, targetVersion, targetRouter;

    if ( spec.targetVersion ) {
      targetApp = spec.targetApp;
      targetVersion = spec.targetVersion;
      kind = 'app';
    } else if ( spec.targetApp ) {
      const matchingRouter = findBy(this.allRouters, 'app', spec.targetApp );

      if ( matchingRouter ) {
        targetRouter = spec.targetApp;
        kind = 'router';
      } else {
        targetApp = spec.targetApp;
        kind = 'app';
      }
    } else {
      kind = 'router';
    }

    return {
      allServices:     null,
      allRouters:      null,
      targetNamespace: spec.targetNamespace || null,
      pickVersion:     !!spec.targetVersion,
      kind,
      targetApp,
      targetVersion,
      targetRouter,
    };
  },

  computed: {
    appOptions() {
      return groupAndFilterOptions(this.allServices, null, {
        groupBy:      null,
        itemValueKey: 'namespaceApp',
        itemLabelKey: 'app',
      });
    },

    routerOptions() {
      return groupAndFilterOptions(this.allRouters, null, {
        groupBy:      null,
        itemValueKey: 'namespaceApp',
        itemLabelKey: 'app',
      });
    },

    versionOptions() {
      const namespaceApp = this.targetApp;

      if ( !namespaceApp ) {
        return [];
      }

      return groupAndFilterOptions(this.allServices, { namespaceApp }, {
        groupBy:      null,
        itemValueKey: 'version',
        itemLabelKey: 'versionWithDateDisplay',
        itemSortKey:  'metadata.creationTimestamp:desc'
      });
    },

    kindOptions() {
      return Object.keys(this.kindLabels).map((k) => {
        return { label: this.kindLabels[k], value: k };
      });
    },

    extraKinds() {
      const out = {};

      for (const key in this.kindLabels) {
        if (!KIND_LABELS[key]) {
          out[key] = this.kindLabels[key];
        }
      }

      return out;
    }
  },

  watch: {
    kind() {
      this.update();
    },
  },

  methods: {
    update(value) {
      const spec = {};

      switch (this.kind) {
      case 'router':
        if ( this.targetRouter ) {
          const [ns, router] = this.targetRouter.split(':', 2);

          this.targetNamespace = ns;
          spec.targetNamespace = ns;
          spec.targetRouter = router;
        }
        break;
      case 'app':
        if ( this.targetApp ) {
          const [ns, app] = this.targetApp.split(':', 2);

          this.targetNamespace = ns;
          spec.targetNamespace = ns;
          spec.targetApp = app;
        }

        if ( this.pickVersion ) {
          if ( this.targetVersion ) {
            spec.targetVersion = this.targetVersion;
          } else if ( this.versionOptions.length ) {
            this.targetVersion = this.versionOptions[0].value;
            spec.targetVersion = this.targetVersion;
          }
        }
        break;
      default:
        spec[this.kind] = value;
      }

      this.$emit('input', cleanUp(spec));
    }
  },
};
</script>

<template>
  <form>
    <Loading v-if="$fetchState.pending" />
    <template v-else>
      <div class="spacer"></div>

      <div>
        <div class="clearfix">
          <h4>Target</h4>
        </div>
        <div v-if="mode === 'view'">
          {{ kindLabels[kind] }}
        </div>
        <div v-else class="row">
          <div v-for="opt in kindOptions" :key="opt.value" class="col">
            <label class="radio">
              <input v-model="kind" :disabled="isView" type="radio" :value="opt.value" />
              {{ opt.label }}
            </label>
          </div>
        </div>
        <div class="row">
          <div v-if="kind === 'router'" class="col span-6">
            <LabeledSelect
              v-model="targetRouter"
              :disabled="isView"
              :options="routerOptions"
              :mode="mode"
              placeholder="Select a Router..."
              :clearable="false"
              class="inline"
              :reduce="opt=>opt.value"
              label="Router"
              @input="update"
            />
          </div>

          <template v-if="kind === 'app'">
            <div class="col span-6">
              <LabeledSelect
                v-model="targetApp"
                :disabled="isView"
                :mode="mode"
                :options="appOptions"
                placeholder="Select a service"
                :reduce="opt=>opt.value"
                :clearable="false"
                class="inline"
                label="Service"
                @input="update"
              />
              <Checkbox v-if="kind==='app'" v-model="pickVersion" label="Target one version" class="mt-10" />
            </div>
            <div v-if="pickVersion" class="col span-6">
              <LabeledSelect
                v-model="targetVersion"
                :disabled="isView"
                :mode="mode"
                :options="versionOptions"
                placeholder="Select a version"
                :clearable="false"
                class="inline"
                label="Version"
                :reduce="opt=>opt.value"
                @input="update"
              />
            </div>
          </template>
          <template v-for="(label, extraKind) of extraKinds">
            <slot v-if="kind===extraKind" :update="update" :name="extraKind">
              {{ label }}
            </slot>
          </template>
        </div>
      </div>
    </template>
  </form>
</template>
