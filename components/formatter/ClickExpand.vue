<script>
import { mapGetters } from 'vuex';
export default {
  props: {
    value: {
      type:    String,
      default: ''
    },
    maxLength: {
      type:    Number,
      default: 20
    },
    size: {
      type:    Number,
      default: null
    },
    units: {
      type:    String,
      default: 'Bytes'
    }
  },
  data() {
    const expanded = this.value.length <= this.maxLength;

    return { expanded };
  },
  computed: {
    preview() {
      if (this.expanded) {
        return this.value;
      } else {
        if (!!this.size) {
          return `${ this.size } ${ this.units }`;
        }

        return this.value.slice(0, this.maxLength);
      }
    },
    ...mapGetters({ t: 'i18n/t' })
  },
  methods: {
    expand() {
      this.expanded = !this.expanded;
    }
  }

};
</script>

<template>
  <span @click.stop="expand">
    {{ preview }}
    <template v-if="!expanded">
      <span v-if="!size">...</span>
      {{ t('generic.clickToShow') }}
    </template>
  </span>
</template>
