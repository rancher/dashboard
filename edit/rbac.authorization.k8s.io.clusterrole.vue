<script>
import RbacPermissions from '@/components/RbacPermissions';
import CreateEditView from '@/mixins/create-edit-view';
import NameNsDescription from '@/components/form/NameNsDescription';
import Footer from '@/components/form/Footer';
import LabeledInput from '@/components/form/LabeledInput';
import RadioGroup from '@/components/form/RadioGroup';

/**
 * Edit view for RBAC Cluster Role
   @displayName Edit RBAC Cluster Role
 */
export default {
  name: 'CruClusterRole',

  components: {
    Footer,
    LabeledInput,
    NameNsDescription,
    RadioGroup,
    RbacPermissions,
  },

  mixins:     [CreateEditView],

  data() {
    const radioOptions = [true, false];
    const lockedLabels = ['Yes, New bindings are not allowed to use this role', 'No'];
    const newUserDefault = ['Yes, Default role for new cluster creation', 'No'];

    return {
      lockedLabels,
      newUserDefault,
      radioOptions,
    };
  },

  methods: {
    /**
     * Sends the user back to cluster roles page after save is finished
     */
    done() {
      this.$router.replace({ name: 'rbac-roles-cluster' });
    }
  },
};
</script>

<template>
  <form>
    <NameNsDescription
      :value="value"
      :mode="mode"
      name-label="Name"
      :register-before-hook="registerBeforeHook"
    >
      <template v-slot:namespace>
        <LabeledInput
          key="name"
          v-model="value.metadata.name"
          label="Name"
          :mode="mode"
        />
      </template>
    </NameNsDescription>

    <div class="spacer"></div>

    <div class="row">
      <div class="col span-6">
        <label>
          Locked
        </label>
        <RadioGroup
          :options="radioOptions"
          :selected="value.locked"
          :labels="lockedLabels"
          @input="e=>value.locked = e"
        />
      </div>
      <div class="col span-6">
        <label>
          Cluster Creator Default
        </label>
        <RadioGroup
          :options="radioOptions"
          :selected="value.clusterCretorDefault"
          :labels="newUserDefault"
          @input="e=>value.clusterCretorDefault = e"
        />
      </div>
    </div>

    <div class="spacer"></div>

    <section>
      <div class="row">
        <RbacPermissions
          v-model="value.rules"
          :mode="mode"
          label="Grant Resources"
          btn-label="Grant Resource"
        />
      </div>
    </section>

    <Footer :mode="mode" :errors="errors" @save="save" @done="done" />
  </form>
</template>
