<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'AddNamedElement',
  components: { LabeledInput },
  mixins:     [VerrazzanoHelper],
  props:      {
    value: {
      type:    Array,
      default: () => ([])
    },
    mode: {
      type:     String,
      required: true,
    },
    addType: {
      // the type of element to be added.
      // used for the button name and text label.
      type:     String,
      required: true,
    },
    fieldLabel: {
      // override the label for the text field
      type:    String,
      default: undefined,
    },
    keyFieldName: {
      // the key in the new object to set, it can be a simple name or a dot-demarcated path to the field
      type:     String,
      required: true,
    },
    namePrefix: {
      // if specified, used to generate the next available name
      type:    String,
      default: undefined,
    }
  },

  data() {
    return {
      newName:      undefined,
      errorMessage: undefined,
    };
  },

  methods: {
    getUnusedName() {
      if (this.namePrefix) {
        return this.getNextName(this.value, this.keyFieldName, this.namePrefix);
      }

      return undefined;
    },

    checkName() {
      this.errorMessage = undefined;

      if (!this.newName) {
        return false;
      }

      if (Array.isArray(this.value)) {
        if (!this.value.every(node => this.newName !== this.get(node, this.keyFieldName))) {
          this.errorMessage = this.t('verrazzano.common.messages.nameInUse', { name: this.newName });

          return false;
        }
      }

      return true;
    },

    getFieldLabel() {
      if (this.fieldLabel) {
        return this.fieldLabel;
      }

      return this.t('verrazzano.common.fields.newElementName', { type: this.addType });
    },

    returnName() {
      if (this.checkName()) {
        this.$emit('input', this.newName);

        this.newName = this.getUnusedName();
      }
    }
  },

  mounted() {
    this.newName = this.getUnusedName();
  },

  watch: {
    newName() {
      this.checkName();
    },
  },
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-6">
        <LabeledInput
          v-model="newName"
          :mode="mode"
          :label="getFieldLabel()"
          required
        />
      </div>
    </div>
    <div v-if="!isView && errorMessage">
      <br />
      <span class="named-error">{{ errorMessage }}</span>
    </div>
    <br />
    <button
      type="button"
      class="btn role-tertiary add"
      data-testid="add-item"
      :disabled="isView || errorMessage || !newName"
      @click="returnName()"
    >
      {{ t('verrazzano.common.buttons.addElement', { type: addType }) }}
    </button>
  </div>
</template>

<style scoped>
.named-error {
  color: var(--error);
}
</style>
