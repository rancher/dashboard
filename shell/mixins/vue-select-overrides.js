
export default {
  data() {
    return { overridesMixinPreventDoubleTriggerKeysOpen: false };
  },
  methods: {
    mappedKeys(map, vm) {
      // Defaults found at - https://github.com/sagalbot/vue-select/blob/master/src/components/Select.vue#L947
      const out = { ...map };

      // tab
      (out[9] = (e) => {
        // user esc'd
        if (!vm.open) {
          return;
        }

        e.preventDefault();
      });

      // escape
      (out[27] = (e) => {
        e.preventDefault();
        e.stopPropagation();

        vm.open = false;
        vm.search = '';

        this.$refs.select.focus();

        return false;
      });

      // enter
      (out[13] = (e, opt) => {
        if (!vm.open) {
          vm.open = true;

          return;
        }

        // if the index of the option is -1
        // it means are pressing enter on an invalid option
        // we should exit
        if (vm.typeAheadPointer === -1) {
          return;
        }

        let option = vm.filteredOptions[vm.typeAheadPointer];

        vm.$emit('option:selecting', option);

        if (!vm.isOptionSelected(option)) {
          if (vm.taggable && !vm.optionExists(option)) {
            vm.$emit('option:created', option);
          }
          if (vm.multiple) {
            option = vm.selectedValue.concat(option);
          }
          vm.updateValue(option);
          vm.$emit('option:selected', option);

          if (vm.closeOnSelect) {
            // this ties in to the Select component implementation
            // so that the enter key handler doesn't open the dropdown again
            this.overridesMixinPreventDoubleTriggerKeysOpen = true;
            vm.open = false;
            vm.typeAheadPointer = -1;
          }

          if (vm.clearSearchOnSelect) {
            vm.search = '';
          }
        }
      });

      //  up.prevent
      (out[38] = (e) => {
        e.preventDefault();

        if (!vm.open) {
          vm.open = true;
        }

        return vm.typeAheadUp();
      });

      //  down.prevent
      (out[40] = (e) => {
        e.preventDefault();

        if (!vm.open) {
          vm.open = true;
        }

        return vm.typeAheadDown();
      });

      return out;
    },
  }
};
