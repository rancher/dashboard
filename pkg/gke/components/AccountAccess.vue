<script lang="ts">
import { defineComponent } from 'vue';
import { _CREATE, _VIEW } from '@shell/config/query-params';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import SelectCredential from '@shell/edit/provisioning.cattle.io.cluster/SelectCredential.vue';
import AsyncButton from '@shell/components/AsyncButton.vue';
import { mapGetters, Store } from 'vuex';
import { getGKEZones } from '../util/gcp';

export default defineComponent({
  name: 'GKEAccountAccess',

  components: {
    LabeledInput,
    SelectCredential,
    AsyncButton
  },

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    credential: {
      type:    String,
      default: null
    },

    project: {
      type:    String,
      default: ''
    },

    isAuthenticated: {
      type:    Boolean,
      default: false
    },
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    CREATE(): string {
      return _CREATE;
    },

    VIEW(): string {
      return _VIEW;
    },

  },

  methods: {
    async testProjectId(cb: (success: Boolean)=>{}) {
      const store = this.$store as Store<any>;

      try {
        await getGKEZones(store, this.credential, this.project, {});

        this.$emit('update:isAuthenticated', true);

        // eslint-disable-next-line standard/no-callback-literal, node/no-callback-literal
        return cb(true);
      } catch (e) {
        this.$emit('error', e);
        this.$emit('update:isAuthenticated', false);

        // eslint-disable-next-line standard/no-callback-literal, node/no-callback-literal
        return cb(false);
      }
    },

    // gcp credentials include a project id - we can grab that and auto-fill to save users having to manually enter it
    // this only applies to new credentials because of the way credential data is stored
    parseNewCredential(e) {
      console.log('****', e);
    }
  },
});
</script>

<template>
  <div
    :class="{'showing-form': !credential}"
    class="credential-project"
  >
    <div
      v-if="!!credential"
      class="project mb-10"
    >
      <LabeledInput
        :disabled="isAuthenticated"
        :value="project"
        label-key="gke.project.label"
        required
        @input="$emit('update:project', $event)"
      />
    </div>
    <div
      class="select-credential-container mb-10"
    >
      <!-- TODO nb can't create new if one already exists...? -->
      <SelectCredential
        :value="credential"
        data-testid="crugke-select-credential"
        :mode="(mode === VIEW || isAuthenticated) ? VIEW : CREATE"
        provider="gcp"
        :default-on-cancel="true"
        :showing-form="!credential"
        class="select-credential"
        :cancel="()=>$emit('cancel-credential')"
        @input="$emit('update:credential', $event)"
        @credential-created="parseNewCredential"
      />
    </div>
    <div
      v-if="!!credential"
      class="auth-button-container mb-10"
    >
      <AsyncButton
        :disabled="!credential || !project || isAuthenticated"
        type="button"
        class="btn role-secondary"
        mode="authenticate"
        @click="testProjectId"
      />
    </div>
  </div>
</template>

<style lang="scss">
  .credential-project {
    display: flex;

    .project {
      flex-basis: 50%;
      flex-grow: 0;
      margin: 0 1.75% 0 0;
    }

    &.showing-form {
      flex-grow:1;
      flex-direction: column;

      &>.project {
        margin: 0;
      }

      &>.select-credential-container{
      display:flex;
      flex-direction: column;
      flex-grow: 1;
      }
    }

    &>.select-credential-container{
      flex-basis: 50%;
      margin: 0 1.75% 0 0;

      &>.select-credential{
        flex-grow: 1;
      }

    }
  }

  .auth-button-container {
    align-content: center;
  }

</style>
