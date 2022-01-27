import { getAllValues } from '@/utils/object';
import formRulesGenerator from '@/utils/validators/formRules/index';

export default {
  data() {
    return {
      formRulesets: [
        /* formRulesets define the validation rules for the entire form. These should almost always be overridden in the form-component using the mixin
        example:
        {
          path:  'spec.template.spec.containers.securityContext.runAsUser', // required: defines the path of the value to be tested against it's rules. Uses this.value unless overridden via optional rootObject
          rootObject: { container: { image: 'name' } } // optional: redirects the path to the object passed here,
          rules: ['noSpaces', 'noPeriods'], // required: array of functions to run against the value of the field defined by the path (and optionally the rulesets rootObject),
          translationKey: '', // optional: defines the displaykey, overrides displaykeys that may otherwise be passed into the translation
        }
        */
      ],
      reportedValidationPaths: [
        // an array of strings that track which ruleset paths have been bound to a field for error reporting
        // tracked in a seperate array from the actual rulesets since we want the option of keeping track of modelValidationRules without mutating the model itself
        // you may place a path in here manually as part of your form's data props...
        // ... or you may place a path in here programitcally by using the "getAndReportPathRules" method
      ]
    };
  },

  methods: {
    // returns an array of validator functions based off path property of the ruleset
    getPathRules(path) {
      return this.rulesets.find(ruleset => ruleset.path === path)?.rules || [];
    },
    // returns an array of validator functions and pushes the path of the relevant ruleset into reportedValidationPaths
    getAndReportPathRules(path) {
      const rules = this.getPathRules(path);

      if (rules.length > 0 && !this.reportedValidationPaths.includes(path)) {
        this.reportedValidationPaths = [...this.reportedValidationPaths, path];
      }

      return rules;
    },
    getPathValues(path) {
      const relevantRuleset = this.rulesets.find(ruleset => ruleset.path === path);

      if (!relevantRuleset) {
        return [];
      }

      return getAllValues(relevantRuleset?.rootObject || this.value, relevantRuleset?.path);
    },
    getPathErrors(paths = []) {
      const messages = paths.reduce((acc, path) => {
        const pathErrors = [];
        const relevantRules = this.getPathRules(path);
        const relevantValues = this.getPathValues(path).map((val, idx, arr) => (arr.length > 1 && typeof val === 'object' && !Array.isArray(val) && val !== null ? { ...val, idx } : val));

        relevantRules.forEach((rule) => {
          relevantValues.forEach((value) => {
            pathErrors.push(rule(value));
          });
        });

        return [...acc, ...pathErrors].filter(error => !!error);
      }, []);

      return messages;
    },
  },
  computed: {
    rulesets() {
      const nullValidator = () => undefined;

      return [
        ...this.formRulesets.map((ruleset) => {
          const formRules = formRulesGenerator(this.$store.getters['i18n/t'], { displayKey: ruleset?.translationKey ? this.$store.getters['i18n/t'](ruleset.translationKey) : 'Value' });

          return {
            ...ruleset,
            rules:               ruleset.rules.map(rule => formRules[rule] || nullValidator),
            formValidationRule: true
          };
        }),
        ...(this?.value?.modelValidationRules || []).map(rule => ({
          ...rule,
          formValidationRule: false
        }))
      ];
    },
    unreportedValidationErrors() {
      const paths = this.rulesets
        .filter(ruleset => !!ruleset.formValidationRule && !this.reportedValidationPaths.includes(ruleset.path))
        .map(ruleset => ruleset.path);

      const formErrors = this.getPathErrors(paths);

      const modelErrors = this.value.customValidationErrors(this.value, this.reportedValidationPaths); // the model already has a means of producing errors, not reinventing the wheel... yet...

      return [...formErrors, ...modelErrors];
    },
    validationErrors() { // checks for any and all errors, regardless of being bound, from the model, or from the form
      const paths = this.rulesets.filter(ruleset => !!ruleset.formValidationRule).map(ruleset => ruleset.path);
      const formErrors = this.getPathErrors(paths);
      const modelErrors = this.value.customValidationErrors(this.value); // the model already has a means of producing errors, not reinventing the wheel... yet...

      return [...formErrors, ...modelErrors];
    },
    formIsValid() {
      return this.validationErrors.length === 0;
    }
  }
};
