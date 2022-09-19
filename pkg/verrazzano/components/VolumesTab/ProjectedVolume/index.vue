<script>
// Added by Verrazzano
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import ProjectionSource from '@pkg/components/VolumesTab/ProjectedVolume/ProjectionSource';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

import { randomStr } from '@shell/utils/string';
import debounce from 'lodash/debounce';

export default {
  name:       'ProjectedVolume',
  components: {
    ArrayListGrouped,
    LabeledInput,
    ProjectionSource,
  },
  mixins: [VerrazzanoHelper],
  props:  {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:    String,
      default: 'create'
    },
    namespacedObject: {
      type:     Object,
      required: true
    },
  },
  data() {
    const { sources = [] } = this.value;

    const projections = sources.map((source) => {
      const projection = this.clone(source);

      projection._id = randomStr(4);

      return projection;
    });

    return { projections };
  },
  computed: {
    showRemoveProjectionButton() {
      return !this.isView && this.projections.length > 1;
    },
  },
  methods: {
    update() {
      const sources = [];

      this.projections.forEach((projection) => {
        const source = this.clone(projection);

        delete source._id;

        sources.push(source);
      });

      this.setFieldIfNotEmpty('sources', sources);
    },
    addProjection() {
      this.projections.push({ _id: randomStr(4) });
    },
    removeProjection(index) {
      this.projections.slice(index, 1);
      this.queueUpdate();
    },
    updateProjection() {
      this.queueUpdate();
    }
  },
  created() {
    this.queueUpdate = debounce(this.update, 500);
  },
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-6">
        <LabeledInput
          :value="getField('defaultMode')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'defaultMode')"
          :label="t('verrazzano.common.fields.volumes.projected.defaultMode')"
          @input="setFieldIfNotEmpty('defaultMode', $event)"
        />
      </div>
    </div>
    <div class="spacer-small" />
    <div>
      <ArrayListGrouped
        :value="projections"
        :mode="mode"
        :default-add-value="{ }"
        :add-label="t('verrazzano.common.buttons.addVolumeProjectionSource')"
        @add="addProjection()"
      >
        <template #remove-button="removeProps">
          <button
            v-if="showRemoveProjectionButton"
            type="button"
            class="btn role-link close btn-sm"
            @click="removeProjection(removeProps.i)"
          >
            <i class="icon icon-2x icon-x" />
          </button>
          <span v-else />
        </template>
        <template #default="props">
          <div class="spacer-small" />
          <ProjectionSource
            v-model="props.row.value"
            :mode="mode"
            :namespaced-object="namespacedObject"
            @input="updateProjection()"
          />
        </template>
      </ArrayListGrouped>
    </div>
  </div>
</template>

<style scoped>

</style>
