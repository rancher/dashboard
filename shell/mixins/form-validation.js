import { getAllValues } from '@shell/utils/object';
import formRulesGenerator from '@shell/utils/validators/formRules/index';

export default {
  data() {
    return {
      /**
       * Define the validation rules for the entire form.
       * These should almost always be overridden in the form-component using the mixin
       *
       * path (required): defines the path of the value to be tested against it's rules. Looks for the relevant path in `this.value` unless an is passed in via rootObject
       * rules (required): array of strings that match which validator functions to run against the value of the field defined by the path (and optionally the rulesets rootObject),
       * rootObject (optional): redirects the path to the object passed here,
       * translationKey (optional): defines the displaykey, overrides displaykeys that may otherwise be passed into the translation
       *
       * NOTE: path of type 'value.value' will be only 'value'
       *
       * Example:
       * {
       *   path:  'container.image',
       *   rules: ['noSpaces', 'noPeriods'],
       *   rootObject: { container: { image: 'name' } },
       *   translationKey: 'Image Name',
       * }
       */
      fvFormRuleSets:            [],
      /**
       * An array of strings that track which ruleset paths have been bound to a field for error
       * reporting tracked in a separate array from the actual rulesets since we want the option
       * of keeping track of modelValidationRules without mutating the model itself you may place
       * a path in here manually as part of your form's data props or you may place a path in
       * here programmatically by using the "fvGetAndReportPathRules" method
       */
      fvReportedValidationPaths: []
    };
  },

  methods: {
    /**
     * Returns an array of validator functions based off path property of the ruleset, use this if you want
     * the array but you don't want the form to track that the rules have been bound to a field
     * @param {*} path
     * @returns
     */
    fvGetPathRules(path) {
      return this.fvRulesets.find((ruleset) => ruleset.path === path)?.rules || [];
    },

    /**
     * Returns an array of validator functions and pushes the path of the relevant ruleset into
     * fvReportedValidationPaths so that we know any error messages are handled by the field using it
     * @param {*} path
     * @returns
     */
    fvGetAndReportPathRules(path) {
      const rules = this.fvGetPathRules(path);

      if (rules.length > 0 && !this.fvReportedValidationPaths.includes(path)) {
        this.fvReportedValidationPaths = [...this.fvReportedValidationPaths, path];
      }

      return rules;
    },

    /**
     * Validates that the path is one that belongs to a ruleset (either a formRuleset or from the
     * modelValidationRules) and returns its value(s) in an array
     * @param {*} path
     * @returns
     */
    fvGetPathValues(path) { //
      // returns even single values as an array to simplify validation logic since
      // some fields may have multiple values
      const relevantRuleset = this.fvRulesets.find((ruleset) => ruleset.path === path);

      if (!relevantRuleset) {
        return [];
      }

      return getAllValues(relevantRuleset?.rootObject || this.value, relevantRuleset?.path);
    },

    fvGetValues(val, idx, arr) {
      return (arr.length > 1 &&
        typeof val === 'object' &&
        !Array.isArray(val) &&
        val !== null ? { ...val, idx } : val
      );
    },

    /**
     * Gets errors from multiple paths, usually used externally to check a single path but used
     * within the mixin to check all paths for errors
     * @param {*} paths
     * @returns
     */
    fvGetPathErrors(paths = []) {
      const messages = paths.reduce((acc, path) => {
        const pathErrors = [];
        const relevantRules = this.fvGetPathRules(path);
        const relevantValues = this.fvGetPathValues(path).map(this.fvGetValues);

        relevantRules.forEach((rule) => {
          relevantValues.forEach((value) => {
            pathErrors.push(rule(value));
          });
        });

        return [...acc, ...pathErrors].filter(Boolean);
      }, []);

      return messages;
    },
  },

  computed: {
    /**
     * fvExtraRules allows you to create rules that might be specific to a form inside of
     * that form component and pass them into the mixin's logic.
     * fvExtraRules needs to return an object with a validation rule function in each key.
     * This is a computed property as returning functions in the data props is not considered
     * a best practice
     * @returns
     */
    fvExtraRules() {
      return {};
    },

    /**
     * Rulesets is a combination of the rules defined in the fvFormRuleSets array and the
     * modelValidationRules in the model. Theoretically, a form could just use the rulesets
     * defined in the model however in practice this can be limiting
     * @returns
     */
    fvRulesets() {
      const nullValidator = () => undefined;

      return [
        ...this.fvFormRuleSets.map((ruleset) => {
          const formRules = {
            ...formRulesGenerator(
              this.$store.getters['i18n/t'],
              { displayKey: ruleset?.translationKey ? this.$store.getters['i18n/t'](ruleset.translationKey) : 'Value' }),
            ...this.fvExtraRules
          };

          return {
            ...ruleset,
            rules:              ruleset.rules.map((rule) => formRules[rule] || nullValidator),
            formValidationRule: true
          };
        }),
        ...(this?.value?.modelValidationRules || []).map((rule) => ({
          ...rule,
          formValidationRule: false
        }))
      ];
    },

    /**
     * If either the fvFormRuleSets or the modelValidationRules throw an error and the associated path
     * isn't in the reportValidationPaths then it'll show up here.
     * Useful for throwing unreported errors into a generic banner
     * @returns
     */
    fvUnreportedValidationErrors() { //
      const paths = this.fvRulesets
        .filter((ruleset) => !!ruleset.formValidationRule && !this.fvReportedValidationPaths.includes(ruleset.path))
        .map((ruleset) => ruleset.path);

      const formErrors = this.fvGetPathErrors(paths);

      // the model already has a means of producing errors, not reinventing the wheel... yet...
      const modelErrors = this.value.customValidationErrors ? this.value.customValidationErrors(this.value, this.fvReportedValidationPaths) : [];

      return [...formErrors, ...modelErrors, ...(this.errors || [])];
    },

    /**
     * Checks for any and all errors, regardless of being bound, from the model, or from the form
     * @returns
     */
    fvValidationErrors() {
      const paths = this.fvRulesets.filter((ruleset) => !!ruleset.formValidationRule).map((ruleset) => ruleset.path);
      const formErrors = this.fvGetPathErrors(paths);

      // the model already has a means of producing errors, not reinventing the wheel... yet...
      const modelErrors = this.value.customValidationErrors ? this.value.customValidationErrors(this.value) : [];

      return [...formErrors, ...modelErrors];
    },

    fvFormIsValid() {
      return this.fvValidationErrors.length === 0;
    }
  }
};
