import SteveModel from '@shell/plugins/steve/steve-class';
import { createElementalRoute } from '../utils/custom-routing';

export default class ElementalResource extends SteveModel {
  get listLocation() {
    return createElementalRoute('resource', { resource: this.type });
  }
}
