<script>
import day from 'dayjs';

export default {
  components: {},

  props: {
    value: {
      type:     String,
      required: true
    },
  },

  data() {
    return { timeOptions: [...Array(48)].map((_, i) => day().startOf('day').add(i * 30, 'minutes').format('HH:mm')) };
  },
  computed: {},
  methods:  {
    click(event, value) {
      event.preventDefault();
      event.stopPropagation();
      this.$emit('input', value);
    }
  },
};
</script>

<template>
  <ol class="time">
    <li v-for="option in timeOptions" :key="option" :class="{selected: value === option}">
      <a href="#" @click="click($event, option)">{{ option }}</a>
    </li>
  </ol>
</template>

<style lang="scss" scoped>
.time {
    height: 100%;
    width: 100%;
    overflow-y: scroll;
    list-style: none;
    padding: 0;
    margin: 0;

    li {
        text-align: center;
        padding: 8px;
        padding-top: 4px;

        &.selected {
            background-color: var(--primary);

            a {
              color: #FFF;
            }
        }

        a:active, a:focus {
            outline: 0;
        }
    }
}
</style>
