<script>
import LabeledInput from '@/components/form/LabeledInput';
import Checkbox from '@/components/form/Checkbox';
import { _EDIT, _VIEW } from '~/config/query-params';

export default ({

  name: 'NotificationSettings',

  components: { LabeledInput, Checkbox },

  props: {
    value: {
      type:    Object,
      default: () => {}
    },

    mode: {
      type: String,
      validator(value) {
        return [_EDIT, _VIEW].includes(value);
      },
      default: _EDIT,
    }
  },

  computed: {
    uiDisabled() {
      return this.mode === _VIEW;
    }
  }

});
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <Checkbox
          :disabled="uiDisabled"
          :value="value.showMessage === 'true'"
          :label="t('notifications.loginError.showCheckboxLabel')"
          @input="e=>$set(value, 'showMessage', e.toString())"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <div class="row">
          <div class="col span-12">
            <LabeledInput
              v-model="value.message"
              :disabled="value.showMessage === 'false' || uiDisabled"
              :label="t('notifications.loginError.messageLabel')"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang='scss'>
.banner-decoration-checkbox {
  position: relative;
  display: inline-flex;
  align-items: flex-start;
  margin: 0;
  cursor: pointer;
  user-select: none;
  border-radius: var(--border-radius);
  padding-bottom: 5px;
  height: 24px;
}
</style>
