import { DESCRIPTION } from '@/config/labels-annotations';
import HybridModel from './hybrid-class';

export default class SteveModel extends HybridModel {
  get name() {
    return this.metadata?.name || this._name;
  }

  get namespace() {
    return this.metadata?.namespace;
  }

  get description() {
    return this.metadata?.annotations?.[DESCRIPTION] || this.spec?.description || this._description;
  }
}
