import SteveModel from '@shell/plugins/steve/steve-class';
import { fields } from '@shell/plugins/steve/resourceUtils/configmap';

export default class ConfigMap extends SteveModel {
  get keysDisplay() {
    return fields.keysDisplay(this);
  }

  // TODO: RC remove me
  // constructor(data, ctx, rehydrateNamespace = null, setClone = false) {
  //   debugger;

  //   super(data, ctx, rehydrateNamespace, setClone);

  //   Object.entries(fields).forEach(([name, func]) => {
  //     Object.defineProperty(this, name, { get: () => func(this) });

  //     // this[name] = () => func(this);
  //   });
  // }
}
