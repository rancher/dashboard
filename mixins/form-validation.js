import { get } from '@/utils/object';

export default {
  data() {
    return {
      formRulesets: [
        /* formRulesets define the validation rules for the entire form. These should almost always be overridden in the form-component using the mixin
        example:
        {
          path:  'spec.template.spec.containers.securityContext.runAsUser', // path of the object in question to test the value of. Will test all values in an array but limited to one level of array
          rules: ['noSpaces', 'noPeriods'] // strings corresponding to test functions returned in the object returned by "validationRules" in computed properties
        }
        */
      ],
      pathAliases: [
        /* pathAliases allow for multiple paths to refer to a single array of rules, they generally define a fragment in the path string to replace rather a full path
        example:
          {
            original: 'spec.template.spec.containers.securityContext',
            alias: 'securityContext'
          }
        */
      ]
    };
  },

  computed: {
    // convernient way to get all ruleset paths into a single array
    formRules() {
      return this.formRulesets.map(ruleset => ruleset.path);
    },

    // global computed propery that checks the components "value" against all the formRules
    formIsValid() {
      return !this.formError(this.formRules, this.value);
    },
    // we don't want indivual components to need to import these when overriding validation rules so they're put into a seperate computed prop that can be spread into "validationRules"
    namedRules() {
      const t = this.$store.getters['i18n/t'];

      return {
        required:        value => !value && value !== 0 ? t('formValidation.required') : undefined,
        noSpaces:        value => !!value && value.includes(' ') ? t('formValidation.noSpaces') : undefined,
        noPeriods:       value => !!value && value.includes('.') ? t('formValidation.noPeriods') : undefined,
        noDashes:        value => !!value && value.includes('-') ? t('formValidation.noDashes') : undefined,
        greaterThanZero: value => Number.isInteger(value) && value <= 0 ? t('formValidation.greaterThanZero') : undefined
      };
    },
    // validationRules can be overridden in the components computed methods to insert bespoke rules that'll validate just like named rules
    // custom validationRules need to accept a function that returns a string (validation message if test fails) or undefined (if the value is okay)
    validationRules() {
      return { ...this.namedRules };
    },
  },

  methods: {
    // returns all rulesets with a path that start with strings passed in as rules
    aliasedRules(rules) {
      const pathAliases = this.pathAliases;
      const rulesAliased = [];

      if (!this.value || rules.length === 0) {
        return false;
      }

      for (const rule of rules) {
        const alias = pathAliases.find(pathAlias => rule === pathAlias.alias);
        const originalRuleFragment = alias ? rule.replace(alias.alias, alias.original) : rule;
        const relevantRuleSets = (this.formRulesets).filter(
          ruleset => ruleset.path.includes(originalRuleFragment)
        );

        if (relevantRuleSets.length === 0) {
          break;
        }

        for (const relevantRuleSet of relevantRuleSets) {
          rulesAliased.push({
            ...relevantRuleSet,
            path: alias ? relevantRuleSet.path.replace(alias.original, alias?.alias) : relevantRuleSet.path
          });
        }
      }

      return rulesAliased;
    },

    // returns a simple boolean if the target object doesn't conform to the rules (array of strings) the function is called with
    // rules can be specific rules, aliased rules, or fragments, a fragment will return all rulesets with a path that starts with the fragment
    formError(rules, target = this) {
      const relevantRuleSets = this.aliasedRules(rules);
      let error = false;

      if (!target || rules.length === 0) {
        return false;
      }

      for (const relevantRuleSet of relevantRuleSets) {
        const relevantValue = get(target, relevantRuleSet.path);

        for (const relevantRule of relevantRuleSet.rules) {
          const testFunction = typeof relevantRule === 'function' ? relevantRule : this.validationRules[relevantRule];

          if (Array.isArray(relevantValue) ? relevantValue.some(value => testFunction(value)) : testFunction(relevantValue)) {
            error = true;
            break;
          }

          if (!!error) {
            break;
          }
        }
        if (!!error) {
          break;
        }
      }

      return error;
    },

    // quick utility function to get an array of rules if you know the specified path. Useful for individual fields
    getRuleFunctionArray(ruleString) {
      return Object.assign({}, ...this.formRulesets.map(ruleset => ({ [ruleset.path]: ruleset.rules.map(ruleString => this.validationRules[ruleString]) })))[ruleString];
    },

    // an object that makes it easy to get an array of rule functions if you know the specific path or path fragment, handy for sub-form components
    formRuleMap(pathFragment) {
      let ruleset = [];

      if (!pathFragment) {
        ruleset = this.formRulesets;
      } else {
        ruleset = this.aliasedRules([pathFragment]);
      }

      return ruleset.reduce((acc, ruleset) => {
        return {
          ...acc,
          [ruleset.path]: ruleset.rules.map(ruleString => this.validationRules[ruleString])
        };
      }, {});
    },
  }
};
