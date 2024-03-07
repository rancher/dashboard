<script>
const VALID_KEYPRESS_TYPES = {
  KEYUP:   'keyup',
  KEYDOWN: 'keydown'
};

export default {
  name:  'KeyPress',
  props: {
    // use the "code" prop of KeyboardEvent as "charCode" and "keyCode" are deprecated
    // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
    // works with array of arrays
    keysToCheck: {
      type:    Array,
      default: () => []
    },
  },

  data() {
    return { keyMap: [] };
  },

  mounted() {
    document.addEventListener(VALID_KEYPRESS_TYPES.KEYUP, this.keyUpHandler);
    document.addEventListener(VALID_KEYPRESS_TYPES.KEYDOWN, this.keyDownHandler);
  },

  beforeDestroy() {
    document.removeEventListener(VALID_KEYPRESS_TYPES.KEYUP, this.keyUpHandler);
    document.removeEventListener(VALID_KEYPRESS_TYPES.KEYDOWN, this.keyDownHandler);
  },

  methods: {
    evaluateKeyCombo() {
      let isKeyComboPressed = false;

      for (let comboIndex = 0; comboIndex < this.keysToCheck.length; comboIndex++) {
        const comboBlock = this.keysToCheck[comboIndex];
        let comboPressed = true;

        for (let keyIndex = 0; keyIndex < comboBlock.length; keyIndex++) {
          if (!this.keyMap.includes(comboBlock[keyIndex])) {
            comboPressed = false;
          }
        }

        if (comboPressed) {
          isKeyComboPressed = true;
          break;
        }
      }

      this.$emit('is-combo-pressed', isKeyComboPressed);
    },
    keyDownHandler(e) {
      this.keysToCheck.forEach((comboBlock) => {
        if (comboBlock.includes(e.code) && !this.keyMap.includes(e.code)) {
          this.keyMap.push(e.code);
          this.evaluateKeyCombo();
        }
      });
    },
    keyUpHandler(e) {
      this.keysToCheck.forEach((comboBlock) => {
        if (comboBlock.includes(e.code)) {
          const index = this.keyMap.findIndex((k) => k === e.code);

          if (index >= 0) {
            this.keyMap.splice(index, 1);
            this.evaluateKeyCombo();
          }
        }
      });
    }
  },
};
</script>

<template>
  <div />
</template>

<style lang="scss" scoped>

</style>
