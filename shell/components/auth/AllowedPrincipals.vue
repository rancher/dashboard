<script>
import { RadioGroup } from '@components/Form/Radio';
import ArrayList from '@shell/components/form/ArrayList';
import Principal from '@shell/components/auth/Principal';
import SelectPrincipal from '@shell/components/auth/SelectPrincipal';
import { _EDIT } from '@shell/config/query-params';
import uniq from 'lodash/uniq';

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

    stacked: {
      type:    Boolean,
      default: false,
    },

    appendSearchToBody: {
      type:    Boolean,
      default: true,
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
      this.authConfig['accessMode'] = 'restricted';
    } if (!this.authConfig.allowedPrincipalIds) {
      this.authConfig['allowedPrincipalIds'] = [];
    }
  },

  methods: {
    addPrincipal(id) {
      this.authConfig.allowedPrincipalIds = uniq([...this.authConfig.allowedPrincipalIds, id]);
    },
  }
};
</script>

<template>
  <div>
    <h3>{{ t('authConfig.accessMode.label') }}</h3>

    <div :class="stacked ? 'allowed-principals__sections' : 'row'">
      <div :class="stacked ? null : 'col span-6'">
        <RadioGroup
          v-model:value="authConfig.accessMode"
          name="accessMode"
          :mode="mode"
          :options="accessModeOptions"
        />
      </div>
      <div :class="stacked ? null : 'col span-6'">
        <h4 v-if="accessMode!=='unrestricted'">
          <t
            k="authConfig.allowedPrincipalIds.title"
            :raw="true"
          />
        </h4>
        <ArrayList
          v-if="accessMode!=='unrestricted'"
          key="allowedPrincipalIds"
          v-model:value="authConfig.allowedPrincipalIds"
          title-key="authConfig.allowedPrincipalIds.label"
          :mode="mode"
          :protip="false"
        >
          <template #value="{row}">
            <Principal
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
              :append-to-body="appendSearchToBody"
              @add="addPrincipal"
            />
          </template>
        </ArrayList>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.allowed-principals__sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>
