<script>
import NameNsDescription from '@/components/form/NameNsDescription';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import LabeledInput from '@/components/form/LabeledInput';
import KeyValue from '@/components/form/KeyValue';

import Footer from '@/components/form/Footer';

export default {
  components: {
    NameNsDescription,
    Tabbed,
    Tab,
    LabeledInput,
    KeyValue,
    Footer,
  },
  data() {
    return { value: { metadata: {} } };
  },
};
</script>

<template>
  <div>
    -masthead
    -name description
    -side tabs
    -form footer
    <NameNsDescription
      v-if="!isView"
      :value="value"
      :namespaced="false"
      :mode="mode"
      :extra-columns="extraColumns"
    >
      <template #project-col>
        <LabeledSelect v-model="project" label="Project" :options="projectOpts" />
      </template>
    </NameNsDescription>
    <Tabbed :side-tabs="true">
      <Tab label="tab1" name="tab1">
        <section>
          <h3>tabby1</h3>
          <LabeledInput />
          <KeyValue />
        </section>
      </Tab>
      <Tab label="tab2" name="tab2">
        <div>
          <section>
            <h3>tabby</h3>
            <LabeledInput />
          </section>
        </div>
      </Tab>
    </Tabbed>
    <Footer
      v-if="showFooter"
      :mode="mode"
      :errors="errors"
      @save="save"
      @done="done"
    >
      <template v-if="!isView" #middle>
        <button
          v-if="showPreview"
          type="button"
          class="btn role-secondary"
          @click="unpreview"
        >
          <t k="resourceYaml.buttons.continue" />
        </button>
        <button
          v-else-if="offerPreview"
          :disabled="yaml === currentYaml"
          type="button"
          class="btn role-secondary"
          @click="preview"
        >
          <t k="resourceYaml.buttons.diff" />
        </button>
      </template>
    </Footer>
  </div>
</template>
