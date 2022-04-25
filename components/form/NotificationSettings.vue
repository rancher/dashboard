<script>
import LabeledInput from '@/components/form/LabeledInput';
import Checkbox from '@/components/form/Checkbox';

export default ({

  name: 'NotificationSettings',

  props: {
    value: {
      type:    Object,
      default: () => {}
    },

    disabled: {
      type:    Boolean,
      default: true,
    }
  },

  components: { LabeledInput, Checkbox },
});
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <Checkbox
          :disabled="disabled"
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
              :disabled="value.showMessage === 'false' || disabled"
              :label="t('notifications.loginError.messageLabel')"
            />
            </labeledinput>
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
