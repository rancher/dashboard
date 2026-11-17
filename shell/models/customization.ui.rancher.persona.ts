import SteveModel from '@shell/plugins/steve/steve-class';
import { set } from '@shell/utils/object';

export interface PersonaRule {
  apiGroups?: string[];
  resources?: string[];
  verbs?: string[];
}

export interface PersonaSpec {
  displayName: string;
  priority: number;
  tags?: string[];
  rules?: PersonaRule[];
}

export default class Persona extends SteveModel {
  declare spec: PersonaSpec;

  applyDefaults() {
    set(this, 'spec', { ...this.createDefaultSpec(), ...this.spec });
  }

  private createDefaultSpec(): PersonaSpec {
    return {
      displayName: '',
      priority:    0,
      tags:        [],
    };
  }
}
