<script>
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import CruResource from '@shell/components/CruResource';
import LabeledInput from '@shell/components/form/LabeledInput';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import FileSelector, { createOnSelected } from '@shell/components/form/FileSelector';

import { randomStr } from '@shell/utils/string';
import CreateEditView from '@shell/mixins/create-edit-view';

export default {
  name: 'HarvesterEditKeypair',

  components: {
    Tab,
    Tabbed,
    CruResource,
    LabeledInput,
    FileSelector,
    NameNsDescription
  },

  mixins: [CreateEditView],

  props: {
    value: {
      type:     Object,
      required: true,
    }
  },

  data() {
    if ( !this.value.spec ) {
      this.value.spec = {};
      this.value.metadata = { name: '' };
    }

    return {
      publicKey:    this.value.spec.publicKey || '',
      randomString: '',
    };
  },

  watch: {
    publicKey(neu) {
      this.value.spec.publicKey = neu;

      const splitSSH = neu.split(/\s+/);

      if (splitSSH.length === 3) {
        if (splitSSH[2].includes('@') && !this.value.metadata.name) {
          this.value.metadata.name = splitSSH[2].split('@')[0];
          this.randomString = randomStr(10).toLowerCase();
        }
      }
    }
  },

  methods: { onKeySelected: createOnSelected('publicKey') },
};
</script>

<template>
  <div class="keypair-card">
    <CruResource
      :done-route="doneRoute"
      :resource="value"
      :mode="mode"
      :errors="errors"
      :apply-hooks="applyHooks"
      @finish="save"
    >
      <div class="header mb-20">
        <FileSelector
          v-if="isCreate"
          class="btn btn-sm bg-primary mt-10"
          :label="t('generic.readFromFile')"
          accept=".pub"
          @selected="onKeySelected"
        />
      </div>

      <NameNsDescription
        ref="nd"
        :key="randomString"
        v-model="value"
        :mode="mode"
      />

      <Tabbed v-bind="$attrs" class="mt-15" :side-tabs="true">
        <Tab name="basic" :label="t('harvester.sshKey.tabs.basics')" :weight="1" class="bordered-table">
          <LabeledInput
            v-model="publicKey"
            type="multiline"
            :mode="mode"
            :min-height="160"
            :label="t('harvester.sshKey.keypair')"
            required
          />
        </Tab>
      </Tabbed>
    </CruResource>
  </div>
</template>

<style lang="scss" scoped>
.header {
  display: flex;
  justify-content: flex-end;
}
</style>
