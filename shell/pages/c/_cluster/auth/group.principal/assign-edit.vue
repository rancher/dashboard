<script>
import FooterComponent from '@shell/components/form/Footer';
import SelectPrincipal from '@shell/components/auth/SelectPrincipal.vue';
import GlobalRoleBindings from '@shell/components/GlobalRoleBindings.vue';
import { NORMAN } from '@shell/config/types';
import { _VIEW, _EDIT } from '@shell/config/query-params';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { NAME } from '@shell/config/product/auth';
import { BLANK_CLUSTER } from '@shell/store';

export default {
  components: {
    SelectPrincipal,
    FooterComponent,
    GlobalRoleBindings,
  },
  data() {
    return {
      errors:       [],
      principalId:  null,
      canLogIn:     false,
      rolesChanged: false,
      editMode:     _EDIT,
    };
  },
  computed: {
    mode() {
      return !this.principalId ? _VIEW : this.$route.query.mode || _VIEW;
    },
    canSave() {
      return this.rolesChanged && this.canLogIn;
    }
  },
  methods: {
    setPrincipal(id) {
      this.principalId = id;

      return true;
    },
    async cancel() {
      await this.navBack();
    },
    async save(buttonDone) {
      this.errors = [];

      try {
        await this.$refs.grb.save();

        await this.$store.dispatch('management/findAll', {
          type: NORMAN.SPOOFED.GROUP_PRINCIPAL,
          opt:  { force: true }
        }, { root: true }); // See PromptRemove.vue

        this.navBack();

        buttonDone(true);
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        buttonDone(false);
      }
    },
    navBack() {
      this.$router.replace({
        name:   `c-cluster-product-resource`,
        params: {
          cluster:  BLANK_CLUSTER,
          product:  NAME,
          resource: NORMAN.SPOOFED.GROUP_PRINCIPAL,
        },
      });
    }
  }
};

</script>

<template>
  <div>
    <div>
      <div class="masthead">
        <header>
          <div class="title">
            <h1 class="m-0">
              {{ t('authGroups.assignEdit.assignTitle') }}
            </h1>
          </div>
        </header>
      </div>

      <form>
        <SelectPrincipal :retain-selection="true" class="mb-20" :show-my-group-types="['group']" :search-group-types="'group'" @add="setPrincipal" />

        <GlobalRoleBindings
          ref="grb"
          :group-principal-id="principalId"
          :mode="mode"
          :assign-only="true"
          @canLogIn="canLogIn = $event"
          @hasChanges="rolesChanged = $event"
        />

        <FooterComponent
          :mode="editMode"
          :errors="errors"
          :disable-save="!canSave"
          @save="save"
          @done="cancel"
        >
        </footercomponent>
      </form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .masthead {
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 10px;
  }
  HEADER {
    margin: 0;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    align-items:center;

    .btn {
      margin-left: 10px;
    }
  }
</style>
