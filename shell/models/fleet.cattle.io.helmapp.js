import { convert, matching, convertSelectorObj } from '@shell/utils/selector';
import jsyaml from 'js-yaml';
import isEmpty from 'lodash/isEmpty';
import { escapeHtml } from '@shell/utils/string';
import { FLEET, MANAGEMENT } from '@shell/config/types';
import { FLEET as FLEET_ANNOTATIONS } from '@shell/config/labels-annotations';
import { addObject, addObjects, findBy, insertAt } from '@shell/utils/array';
import { set } from '@shell/utils/object';
import SteveModel from '@shell/plugins/steve/steve-class';
import {
  colorForState, mapStateToEnum, primaryDisplayStatusFromCount, stateDisplay, FLEET_DASHBOARD_STATES, STATES_ENUM, stateSort,
} from '@shell/plugins/dashboard-store/resource-class';
import { NAME } from '@shell/config/product/explorer';
import FleetUtils from '@shell/utils/fleet';

export default class HelmOp extends SteveModel {
  get dashboardState() {
    return FLEET_DASHBOARD_STATES[this.state]?.color;
  }

  get fleetIcon() {
    return 'icon icon-linux';
  }
}
