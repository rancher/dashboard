import { colorForState, _getStateDisplay as resourceClassGetStateDisplay } from '@shell/plugins/steve/resourceUtils/resource-class';
import { findBy } from '@shell/utils/array';
import { get } from '@shell/utils/object';

export function _getReadyMessage(resource) {
  const conditions = get(resource, 'status.conditions');
  const readyMessage = (findBy(conditions, 'type', 'Ready') || {}).message ;

  return readyMessage;
}

export function _getColorForState(resource) {
  if (resource.readyMessage) {
    return colorForState(resource.readyMessage);
  }

  return colorForState();
}

export function _getStateDisplay(resource) {
  if (resource.readyMessage) {
    return resourceClassGetStateDisplay({ state: resource.readyMessage });
  }

  return resourceClassGetStateDisplay();
}

export const calculatedFields = [
  { name: 'readyMessage', func: _getReadyMessage },
  { name: 'colorForState', func: _getColorForState },
  { name: 'stateDisplay', func: _getStateDisplay }
];
