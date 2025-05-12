import FleetApplication from '@shell/models/fleet-application';

export default class HelmOp extends FleetApplication {
  get dashboardIcon() {
    return 'icon icon-helm';
  }
}
