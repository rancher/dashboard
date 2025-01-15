
export default {
  methods: {
    mappedKeys(map, vm) {
      // Defaults found at - https://github.com/sagalbot/vue-select/blob/master/src/components/Select.vue#L947
      const out = { ...map };

      // escape key
      (out[27] = (e) => {
        // this will prevent propagation to global escape key handler
        // that is responsible for closing a modal
        // probably we can gate it to a prop...
        if (vm.open) {
          e.stopPropagation();
        }

        vm.open = false;
        vm.search = '';

        return false;
      });

      // enter key
      (out[13] = (e, opt) => {
        if (!vm.open) {
          vm.open = true;

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
