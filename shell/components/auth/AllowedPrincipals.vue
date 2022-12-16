<script>
import { RadioGroup } from '@components/Form/Radio';
import ArrayList from '@shell/components/form/ArrayList';
import Principal from '@shell/components/auth/Principal';
import SelectPrincipal from '@shell/components/auth/SelectPrincipal';
import { _EDIT } from '@shell/config/query-params';
import { addObject } from '@shell/utils/array';

export default {
  components: {
    SelectPrincipal,
    ArrayList,
    RadioGroup,
    Principal,
  },

  props: {
    provider: {
      type:     String,
      required: true,
    },

    authConfig: {
      type:     Object,
      required: true,
    },

    mode: {
      type:    String,
      default: _EDIT,
    },
  },

  computed: {
    accessModeOptions() {
      return ['unrestricted', 'restricted', 'required'].map((k) => {
        return {
          label: this.t(`authConfig.accessMode.${ k }`, { provider: this.authConfig.nameDisplay }),
          value: k,
        };
      });
    },

    accessMode() {
      return this.authConfig?.accessMode;
    }
  },

  created() {
    if ( !this.authConfig.accessMode ) {
      this.$set(this.authConfig, 'accessMode', 'restricted');
    } if (!this.authConfig.allowedPrincipalIds) {
      this.$set(this.authConfig, 'allowedPrincipalIds', []);
    }
  },

  methods: {
    addPrincipal(id) {
      addObject(this.authConfig.allowedPrincipalIds, id);
    },
  }
};
</script>

<template>
  <div>
    <h3>{{ t('authConfig.accessMode.label', {provider: authConfig.nameDisplay}) }}</h3>

    <div class="row">
      <div class="col span-6">
        <RadioGroup
          v-model="authConfig.accessMode"
          name="accessMode"
          :mode="mode"
          :options="accessModeOptions"
        />
      </div>
      <div class="col span-6">
        <h4 v-if="accessMode!=='unrestricted'">
          <t
            k="authConfig.allowedPrincipalIds.title"
            :raw="true"
          />
        </h4>
        <ArrayList
          v-if="accessMode!=='unrestricted'"
          key="allowedPrincipalIds"
          v-model="authConfig.allowedPrincipalIds"
          title-key="authConfig.allowedPrincipalIds.label"
          :mode="mode"
          :protip="false"
        >
          <template #value="{row}">
            <Principal
              :key="row.value"
              :value="row.value"
            />
          </template>

          <template
            v-if="authConfig.allowedPrincipalIds.length <= 1"
            #remove-button
          >
            <button
              type="button"
              disabled
              class="btn role-link bg-transparent"
            >
              {{ t('generic.remove') }}
            </button>
          </template>

          <template #add>
            <SelectPrincipal
              :mode="mode"
              @add="addPrincipal"
            />
          </template>
        </ArrayList>
      </div>
    </div>
  </div>
</template>
