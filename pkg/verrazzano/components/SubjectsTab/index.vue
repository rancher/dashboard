<script>
// Added by Verrazzano
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import Subject from '@pkg/components/SubjectsTab/Subject';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

import { randomStr } from '@shell/utils/string';
import debounce from 'lodash/debounce';

export default {
  name:       'Subjects',
  components: {
    ArrayListGrouped,
    Subject,
    TabDeleteButton,
    TreeTab,
  },
  mixins: [VerrazzanoHelper],
  props:  {
    value: {
      type:    Array,
      default: () => ([])
    },
    mode: {
      type:    String,
      default: 'create'
    },
    tabName: {
      type:     String,
      required: true
    },
    tabLabel: {
      type:    String,
      default: ''
    },
  },
  data() {
    const subjects = this.value.map((subject) => {
      const newSubject = this.clone(subject);

      newSubject._id = randomStr(4);

      return newSubject;
    });

    return {
      treeTabName:  this.tabName,
      treeTabLabel: this.tabLabel,
      subjects,
    };
  },
  methods: {
    update() {
      const subjects = [];

      this.subjects.forEach((subject) => {
        const newSubject = this.clone(subject);

        delete newSubject._id;

        subjects.push(newSubject);
      });
      this.$emit('input', subjects);
    },
    addSubject() {
      this.subjects.push({ _id: randomStr(4) });
    },
    removeSubject(index) {
      this.subjects.splice(index, 1);
      this.queueUpdate();
    }
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.common.tabs.subjects');
    }

    this.queueUpdate = debounce(this.update, 500);
  },
};
</script>

<template>
  <TreeTab :name="treeTabName" :label="treeTabLabel">
    <template #beside-header>
      <TabDeleteButton
        :element-name="treeTabLabel"
        :mode="mode"
        @click="$emit('delete', value)"
      />
    </template>
    <template #default>
      <ArrayListGrouped
        :value="subjects"
        :mode="mode"
        :default-add-value="{ }"
        :add-label="t('verrazzano.common.buttons.addSubject')"
        @add="addSubject()"
      >
        <template #remove-button="removeProps">
          <button
            v-if="!isView && subjects.length > 0"
            type="button"
            class="btn role-link close btn-sm"
            @click="removeSubject(removeProps.i)"
          >
            <i class="icon icon-2x icon-x" />
          </button>
          <span v-else />
        </template>
        <template #default="props">
          <div class="spacer-small" />
          <Subject
            :value="props.row.value"
            :mode="mode"
            @input="queueUpdate"
          />
        </template>
      </ArrayListGrouped>
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
