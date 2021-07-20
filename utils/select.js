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
