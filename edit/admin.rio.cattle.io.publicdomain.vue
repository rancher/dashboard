<script>
import { TLS } from '@/models/secret';
import LoadDeps from '@/mixins/load-deps';
import Loading from '@/components/Loading';
import CreateEditView from '@/mixins/create-edit-view';
import NameNsDescription from '@/components/form/NameNsDescription';
import Footer from '@/components/form/Footer';
import { RIO, SECRET } from '@/config/types';
import { groupAndFilterOptions } from '@/utils/group';
import { allHash } from '@/utils/promise';
import Target from '@/components/form/Target';

const KIND_LABELS = {
  router:  'A router',
  app:     'All versions of a service',
  version: 'A single version of a service',
};

const SECRET_LABELS = {
  auto:    'Automatically generate a certificate',
  secret:  'Choose a secret in the rio-system namespace',
};

export default {
  name: 'CruPublicDomain',

  components: {
    Target,
    Loading,
    NameNsDescription,
    Footer,
  },
  mixins: [CreateEditView, LoadDeps],

  data() {
    let spec = this.value.spec;

    if ( !this.value.spec ) {
      spec = {};
      this.value.spec = spec;
    }

    let kind, secretKind, secret;

    if ( spec.secret ) {
      secret = spec.secret;
      secretKind = 'secret';
    } else {
      secretKind = 'auto';
    }

    return {
      allSecrets:      null,
      targetNamespace: spec.targetNamespace || null,

      kind,
      secretKind,
      secret,
    };
  },

  computed: {
    appOptions() {
      return groupAndFilterOptions(this.allServices, null, {
        itemValueKey: 'namespaceApp', itemLabelKey: 'app', groupBy: null
      });
    },

    routerOptions() {
      // return this.allRouters;
      return groupAndFilterOptions(this.allRouters, null, {
        itemValueKey: 'namespaceApp', itemLabelKey: 'app', groupBy: null
      });
    },

    secretOptions() {
      return groupAndFilterOptions(this.allSecrets, {
        'metadata.namespace': RIO.SYSTEM_NAMESPACE,
        secretType:           TLS,
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
      const hash = await allHash({ secrets: this.$store.dispatch('cluster/findAll', { type: SECRET }) });

      this.allSecrets = hash.secrets;
    },

    update() {
      const spec = this.value.spec;

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
        v-model="value"
        :namespaced="false"
        :mode="mode"
        name-label="Name"
      />

      <div class="spacer"></div>

      <Target v-model="value.spec" />

      <div class="title clearfix mt-20">
        <h4>Certificate</h4>
      </div>

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
        <v-select
          v-model="secret"
          :options="secretOptions"
          placeholder="Select a Certificate Secret..."
          :reduce="opt=>opt.value"
          :clearable="false"
          class="inline"

          @input="update"
        />
      </div>

      <Footer :mode="mode" :errors="errors" @save="save" @done="done" />
    </template>
  </form>
</template>

<style  lang='scss'>
  .section {
    display: flex;
    flex-direction: column;
    padding-bottom: 20px;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--border);
  }
</style>
