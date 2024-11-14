<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import { _EDIT, _VIEW } from '@shell/config/query-params';

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

});
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <Checkbox
          :mode="mode"
          :value="value.showMessage === 'true'"
          :label="t('notifications.loginError.showCheckboxLabel')"
          @update:value="value.showMessage = $event.toString()"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <div class="row">
          <div class="col span-12">
            <LabeledInput
              v-model:value="value.message"
              :mode="mode"
              :disabled="value.showMessage === 'false'"
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
