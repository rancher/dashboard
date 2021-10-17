export const countErrors = ( formValidators ) => {
  // formValidators is expected to be an array of
  // functions where each function validates a specific
  // form value. For example, the form calling countErrors
  // could pass in form values in this format, passing
  // in form state as an argument for each validator:
  //
  //   const formValidators = [
  //     () => meetsNameRequirements(this.value.name),
  //     () => meetsDescriptionRequirements(this.value.description)
  //   ];
  //
  // If the validator passes, it is expected to
  // return { isValid: true }.
  //
  // If the validator fails, it is expected to return
  //
  //   {
  //     isValid: false,
  //     errorMessage: "Error message goes here."
  //   }
  // The error message should be limited to the error
  // for a single field.
  const countReducer = ( previousValue, currentValidator ) => {
    const validationResult = currentValidator();

    if (!validationResult.isValid) {
      return previousValue + 1;
    }

    return previousValue;
  };
  const count = formValidators.reduce(countReducer, 0);

  return count;
};
