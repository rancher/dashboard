<script>
import { BadgeState } from '@components/BadgeState';

const STATUS_CLASS_MAP = {
  success: {
    color: 'bg-success',
    icon:  'icon-checkmark'
  },
  warning: {
    color: 'bg-warning',
    icon:  'icon-warning'
  },
  info: {
    color: 'bg-info',
    icon:  'icon-info'
  },
  error: {
    color: 'bg-error',
    icon:  'icon-error'
  }
};

export default {
  components: { BadgeState },
  props:      {
    status: {
      type: String,
      validator(value) {
        return Object.keys(STATUS_CLASS_MAP).includes(value);
      },
      required: true
    },
    message: {
      type:     String,
      required: true
    }
  },
  computed: {
    color() {
      return STATUS_CLASS_MAP[this.status].color;
    },
    icon() {
      return STATUS_CLASS_MAP[this.status].icon;
    }
  }
};
</script>

<template>
  <BadgeState
    :label="message"
    :color="color"
    :icon="icon"
  />
</template>
