<script>
import CreateEditView from '@/mixins/create-edit-view';
import Loading from '@/components/Loading';
import CruResource from '@/components/CruResource';
import SelectIconGrid from '@/components/SelectIconGrid';
import { REGISTER, SUB_TYPE, _FLAGGED } from '@/config/query-params';
import { DEFAULT_WORKSPACE } from '@/models/rancher.cattle.io.cluster';
import { sortBy } from '@/utils/sort';
import Rke2 from './rke2';

const SORT_GROUPS = {
  template:  1,
  kontainer: 2,
  machine:   3,
  register:  4,
  custom:    5,
};

export default {
  name: 'CruCluster',

  components: {
    Loading,
    CruResource,
    SelectIconGrid,
    Rke2,
  },

  mixins: [CreateEditView],

  props: {
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:    Object,
      default: null,
    }
  },

  async fetch() {
    if ( this.subType ) {
      await this.selectType(this.subType, false);
    } else if ( this.value.spec?.rkeConfig?.nodePools?.[0]?.nodeConfig?.kind ) {
      const type = this.value.spec.rkeConfig.nodePools[0].nodeConfig.kind.replace(/config$/i, '').toLowerCase();

      await this.selectType(type, false);
    }

    if ( !this.value.id ) {
      if ( !this.value.metadata ) {
        this.$set(this.value, 'metadata', {});
      }

      this.$set(this.value.metadata, 'namespace', DEFAULT_WORKSPACE);
    }
  },

  data() {
    const subType = this.$route.query[SUB_TYPE] || null;
    const isRegister = this.$route.query[REGISTER] === _FLAGGED;

    return {
      subType,
      isRegister,
      providerCluster: null,
    };
  },

  computed: {
    subTypes() {
      const getters = this.$store.getters;
      const isRegister = this.isRegister;

      const out = [];

      // @TODO come from somewhere dynamic...
      const templates = ['usertemplate1', 'usertemplate2'];
      const machineTypes = ['amazonec2', 'digitalocean'];
      const kontainerTypes = ['amazoneks', 'googlegke', 'azureaks'];
      const customTypes = ['custom'];
      const customRegisterTypes = ['import'];

      kontainerTypes.forEach((id) => {
        addType(id, 'kontainer', true);
      });

      if ( isRegister ) {
        customRegisterTypes.forEach((id) => {
          addType(id, 'custom', true);
        });
      } else {
        templates.forEach((id) => {
          addType(id, 'template', true);
        });

        machineTypes.forEach((id) => {
          addType(id, 'machine', false);
        });

        customTypes.forEach((id) => {
          addType(id, 'custom', true);
        });
      }

      return out;

      function addType(id, group, disabled) {
        const label = getters['i18n/withFallback'](`cluster.provider."${ id }"`, null, id);
        const description = getters['i18n/withFallback'](`cluster.providerDescription."${ id }"`, null, '');
        let icon = require('~/assets/images/generic-driver.svg');

        if ( group !== 'template' ) {
          try {
            icon = require(`~/assets/images/driver/${ id }.svg`);
          } catch (e) {}
        }

        const subtype = {
          id,
          label,
          description,
          icon,
          group,
          disabled,
        };

        out.push(subtype);
      }
    },

    groupedSubTypes() {
      const out = {};

      for ( const row of this.subTypes ) {
        const name = row.group;
        let entry = out[name];

        if ( !entry ) {
          entry = {
            name,
            label: this.$store.getters['i18n/withFallback'](`cluster.providerGroup."${ this.isRegister ? 'register-' : 'create-' }${ name }"`, null, name),
            types: [],
            sort:  SORT_GROUPS[name],
          };

          out[name] = entry;
        }

        entry.types.push(row);
      }

      return sortBy(Object.values(out), 'sort');
    },
  },

  methods: {
    colorFor(obj) {
      return `color${ SORT_GROUPS[obj.group] || 1 }`;
    },

    clickedType(obj) {
      const id = obj.id;

      this.$router.applyQuery({ [SUB_TYPE]: id });
      this.selectType(id);
    },

    selectType(type, fetch = true) {
      this.subType = type;
      this.$emit('set-subtype', this.$store.getters['i18n/withFallback'](`cluster.provider."${ type }"`, null, type));

      if ( fetch ) {
        this.$fetch();
      }
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    :mode="mode"
    :validation-passed="true"
    :selected-subtype="subType"
    :resource="value"
    :errors="errors"
    :done-route="doneRoute"
    :subtypes="subTypes"
    @finish="save"
    @select-type="selectType"
    @error="e=>errors = e"
  >
    <template #subtypes>
      <div v-for="obj in groupedSubTypes" :key="obj.id" class="mb-20" style="width: 100%;">
        <h4>
          {{ obj.label }}
        </h4>
        <SelectIconGrid
          :rows="obj.types"
          key-field="id"
          name-field="label"
          :color-for="colorFor"
          @clicked="clickedType"
        />
      </div>
    </template>

    <!-- @TODO load appropriate component for provider -->
    <Rke2
      v-if="subType"
      v-model="value"
      :mode="mode"
      :provider="subType"
    />

    <template v-if="subType" #form-footer>
      <div><!-- Hide the outer footer --></div>
    </template>
  </CruResource>
</template>
