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

  emits: ['update:isAuthenticated', 'error', 'update:project', 'cancel-credential', 'update:credential'],

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

  created() {
    if (this.mode === _VIEW) {
      this.$emit('update:isAuthenticated', true);
    }
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    CREATE(): string {
      return _CREATE;
    },

    VIEW(): string {
      return _VIEW;
    },

    isView():boolean {
      return this.mode === _VIEW;
    }

  },

  methods: {
    async testProjectId(cb: (success: Boolean)=>{}) {
      const store = this.$store as Store<any>;

      try {
        await getGKEZones(store, this.credential, this.project, {});

        this.$emit('update:isAuthenticated', true);

        // eslint-disable-next-line node/no-callback-literal
        return cb(true);
      } catch (e) {
        this.$emit('error', e?.data || e);
        this.$emit('update:isAuthenticated', false);

        // eslint-disable-next-line node/no-callback-literal
        return cb(false);
      }
    },

    // gcp credentials include a project id - we can grab that and auto-fill to save users having to manually enter it
    // this only applies to new credentials because of the way credential data is stored
    parseNewCredential(e) {
      const authJson = e?.googlecredentialConfig?.authEncodedJson;

      if (authJson) {
        try {
          // eslint-disable-next-line camelcase
          const { project_id:projectId } = JSON.parse(authJson);

          if (projectId) {
            this.$emit('update:project', projectId);
          }
        } catch (e) {

        }
      }
    }
  },
});
</script>

<template>
  <div>
    <div
      :class="{'showing-form': !credential}"
      class="credential-project"
    >
      <div
        v-show="!!credential"
        class="project mb-10"
      >
        <LabeledInput
          :disabled="isAuthenticated"
          :value="project"
          label-key="gke.project.label"
          required
          @update:value="$emit('update:project', $event)"
        />
      </div>
      <div
        :class="{'view': isView}"
        class="select-credential-container mb-10"
      >
        <SelectCredential
          :value="credential"
          data-testid="crugke-select-credential"
          :mode="(isView|| isAuthenticated) ? VIEW : CREATE"
          provider="gcp"
          :default-on-cancel="true"
          :showing-form="!credential"
          class="select-credential"
          :cancel="()=>$emit('cancel-credential')"
          @update:value="$emit('update:credential', $event)"
          @credential-created="parseNewCredential"
        />
      </div>
    </div>
    <div
      v-if="!isView && !isAuthenticated"
      class="row mt-10"
    >
      <div
        v-show="!!credential"
        class="auth-button-container mb-10"
      >
        <AsyncButton
          :disabled="!credential || !project || isAuthenticated"
          type="button"
          class="btn"
          mode="authenticate"
          @click="testProjectId"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .credential-project {
    display: flex;
    min-width: 150px;
    .project {
      flex-basis: 49.25%;
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
      flex-basis: 49.25%;

      &.view{
        margin: 0;
      }

      &>.select-credential{
        flex-grow: 1;
      }

    }
  }

  .auth-button-container {
    align-content: center;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }

</style>
