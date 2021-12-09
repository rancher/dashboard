import $ from 'jquery';

export function onClickOption(option, e) {
  if (!this.$attrs.multiple) {
    return;
  }

  const getValue = opt => (this.optionKey ? this.get(opt, this.optionKey) : this.getOptionLabel(opt));
  const optionValue = getValue(option);
  const value = this.value || [];
  const optionIndex = value.findIndex(option => getValue(option) === optionValue);

  if (optionIndex < 0) {
    return;
  }

  this.value.splice(optionIndex, 1);

  this.$emit('input', this.value);
  e.preventDefault();
  e.stopPropagation();

  if (this.closeOnSelect) {
    this.$refs['select-input'].closeSearchOptions();
  }
}

// This is a simpler positiionner for the dropdown for a select control
// We used to use popper for these, but it does not suppotr fractional pixel placements which
// means the dropdown does not appear aligned to the control when placed in a column-based layout
export function calculatePosition(dropdownList, component, width, placement) {
  const r = $(component.$parent.$el)[0].getBoundingClientRect();
  const p = placement || 'bottom-start';
  let top;
  const bottom = window.innerHeight - r.y - 2;

  // If placement is not at the top, then position if underneath
  if (!p.includes('top')) {
    // Position is bottom
    top = r.y + r.height - 2;

    // Check to see if the dropdown would fall off the screen, if so, try putting it above
    const end = top + dropdownList.offsetHeight;

    if (end > window.innerHeight) {
      top = undefined;
    }
  }

  if (!top) {
    dropdownList.style.bottom = `${ bottom }px`;
    dropdownList.classList.add('vs__dropdown-up');
  } else {
    dropdownList.style.top = `${ top }px`;
    dropdownList.classList.remove('vs__dropdown-up');
  }

  dropdownList.style.left = `${ r.x }px`;
  dropdownList.style.width = 'min-content';
  dropdownList.style.minWidth = `${ r.width }px`;
}
