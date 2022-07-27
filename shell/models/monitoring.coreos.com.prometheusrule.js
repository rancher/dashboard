import SteveModel from '@shell/plugins/steve/steve-class';

export default class PrometheusRule extends SteveModel {
  get _availableActions() {
    // the user cannot edit PrometheusRules with a "period" in the name because the name cannot be edited after creation and the backend will reject any name with a "period"
    const out = super._availableActions.filter((action) => {
      return !this.metadata.name.includes('.') || !['goToEdit', 'goToEditYaml', 'goToClone'].includes(action.action);
    });

    return out;
  }

  get customValidationRules() {
    return [
      {
        nullable:       false,
        path:           'metadata.name',
        required:       true,
        translationKey: 'generic.name',
        type:           'dnsLabel',
      },
      {
        nullable:   false,
        path:       'spec',
        required:   true,
        type:       'array',
        validators: ['ruleGroups'],
      },
      {
        nullable:   false,
        path:       'spec.groups',
        required:   true,
        type:       'array',
        validators: ['groupsAreValid'],
      },
    ];
  }
}
