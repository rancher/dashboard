<script>
import { findBy } from '../../utils/array';
import { TLS } from '../../models/core.v1.secret';
import LoadDeps from '@/mixins/load-deps';
import Loading from '@/components/Loading';
import CreateEditView from '@/mixins/create-edit-view';
import NameNsDescription from '@/components/form/NameNsDescription';
import LabeledSelect from '@/components/form/LabeledSelect';
import Footer from '@/components/form/Footer';
import { RIO, SECRET } from '@/config/types';
import { groupAndFilterOptions } from '@/utils/group';
import { allHash } from '@/utils/promise';

const KIND_LABELS = {
  'router':  'A router',
  'app':     'All versions of a service',
  'version': 'A single version of a service',
};

const SECRET_LABELS = {
  'auto':    'Automatically generate a certificate',
  'secret':  'Choose a secret in the rio-system namespace',
};

export default {
  name: 'CruPublicDomain',

  components: {
    Loading,
    NameNsDescription,
    LabeledSelect,
    Footer,
  },
  mixins:     [CreateEditView, LoadDeps],

  data() {
    let spec = this.value.spec;

    if ( !this.value.spec ) {
      spec = {};
      this.value.spec = spec;
    }

    let kind, targetApp, targetVersion, targetRouter, secretKind, secret;

    if ( spec.targetVersion ) {
      targetApp = spec.targetApp;
      targetVersion = spec.targetVersion;
      kind = 'version';
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

    if ( spec.secret ) {
      secret = spec.secret;
      secretKind = 'secret';
    } else {
      secretKind = 'auto';
    }

    return {
      allServices:     null,
      allRouters:      null,
      allSecrets:      null,
      targetNamespace: spec.targetNamespace || null,

      kind,
      targetApp,
      targetVersion,
      targetRouter,
      secretKind,
      secret,
    };
  },

  computed: {
    appOptions() {
      return groupAndFilterOptions(this.allServices, null, { itemValueKey: 'namespaceApp', itemLabelKey: 'app' });
    },

    routerOptions() {
      return groupAndFilterOptions(this.allRouters, null, { itemValueKey: 'namespaceApp', itemLabelKey: 'app' });
    },

    secretOptions() {
      return groupAndFilterOptions(this.allSecrets, {
        'metadata.namespace': RIO.SYSTEM_NAMESPACE,
        'secretType':         TLS,
      }, {
        groupBy:      null,
        itemValueKey: 'metadata.name',
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

    kindLabels() {
      return KIND_LABELS;
    },

    kindOptions() {
      return Object.keys(KIND_LABELS).map((k) => {
        return { label: KIND_LABELS[k], value: k };
      });
    },

    secretKindLabels() {
      return SECRET_LABELS;
    },

    secretKindOptions() {
      return Object.keys(SECRET_LABELS).map((k) => {
        return { label: SECRET_LABELS[k], value: k };
      });
    }
  },

  watch: {
    kind() {
      this.update();
    },

    secretKind() {
      this.update();
    },
  },

  methods: {
    async loadDeps() {
      const hash = await allHash({
        services: this.$store.dispatch('cluster/findAll', { type: RIO.SERVICE }),
        routers:  this.$store.dispatch('cluster/findAll', { type: RIO.ROUTER }),
        secrets:  this.$store.dispatch('cluster/findAll', { type: SECRET }),
      });

      this.allServices = hash.services;
      this.allRouters = hash.routers;
      this.allSecrets = hash.secrets;
    },

    update() {
      const spec = this.value.spec;

      spec.targetNamespace = null;
      spec.targetRouter = null;
      spec.targetApp = null;
      spec.targetVersion = null;

      switch ( this.kind ) {
      case 'router':
        if ( this.targetRouter ) {
          const [ns, router] = this.targetRouter.split(':', 2);

          this.targetNamespace = ns;
          spec.targetNamespace = ns;
          spec.targetRouter = router;
        }

        break;
      case 'app':
      case 'version':
        if ( this.targetApp ) {
          const [ns, app] = this.targetApp.split(':', 2);

          this.targetNamespace = ns;
          spec.targetNamespace = ns;
          spec.targetApp = app;
        }

        if ( this.kind === 'version' ) {
          if ( this.targetVersion ) {
            spec.targetVersion = this.targetVersion;
          } else if ( this.versionOptions.length ) {
            this.targetVersion = this.versionOptions[0].value;
            spec.targetVersion = this.targetVersion;
          }
        }

        break;
      }

      if ( this.secretKind === 'secret' ) {
        if ( this.secret ) {
          spec.secretName = this.secret;
        }
      }
    }
  },
};
</script>

<template>
  <form>
    <Loading ref="loader" />
    <div v-if="loading">
    </div>
    <template v-else>
      <NameNsDescription
        :namespaced="false"
        :value="value"
        :mode="mode"
        name-label="Name"
      />

      <div class="spacer"></div>

      <div>
        <h4>Target</h4>
        <div v-if="mode === 'view'">
          {{ kindLabels[kind] }}
        </div>
        <div v-else class="row">
          <div v-for="opt in kindOptions" :key="opt.value" class="col">
            <label class="radio">
              <input v-model="kind" type="radio" :value="opt.value" />
              {{ opt.label }}
            </label>
          </div>
        </div>

        <div v-if="kind === 'router'" class="mt-20">
          <LabeledSelect
            v-model="targetRouter"
            :options="routerOptions"
            :grouped="true"
            :mode="mode"
            label="Target Router"
            placeholder="Select a Router..."
            @input="update"
          />
        </div>

        <div v-if="kind === 'app' || kind === 'version'" class="mt-20">
          <LabeledSelect
            v-model="targetApp"
            :mode="mode"
            label="Target App"
            :options="appOptions"
            :grouped="true"
            placeholder="Select a service"
            @input="update"
          />
        </div>

        <div v-if="kind === 'version'" class="mt-20">
          <LabeledSelect
            v-model="targetVersion"
            label="Target Version"
            :mode="mode"
            :options="versionOptions"
            placeholder="Select a version"
            @input="update"
          />
        </div>

        <div class="spacer"></div>

        <h4>Certificate</h4>
        <div v-if="mode === 'view'">
          {{ secretKindLabels[kind] }}
        </div>
        <div v-else class="row">
          <div v-for="opt in secretKindOptions" :key="opt.value" class="col">
            <label class="radio">
              <input v-model="secretKind" type="radio" :value="opt.value" />
              {{ opt.label }}
            </label>
          </div>
        </div>

        <div v-if="secretKind === 'secret'" class="mt-20">
          <LabeledSelect
            v-model="secret"
            :mode="mode"
            label="Secret Name"
            :options="secretOptions"
            placeholder="Select a Certificate Secret..."
            @input="update"
          />
        </div>
      </div>

      <Footer :mode="mode" :errors="errors" @save="save" @done="done" />
    </template>
  </form>
</template>
