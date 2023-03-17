
import { NORMAN_NAME } from '@shell/config/labels-annotations';
import { escapeHtml, ucFirst } from '@shell/utils/string';
import { sortableNumericSuffix } from '@shell/utils/sort';
import isFunction from 'lodash/isFunction';
import {
  DEFAULT_COLOR,
  REMAP_STATE,
  SORT_ORDER,
  STATES,
} from '@shell/plugins/dashboard-store/resource-constants';

export function maybeFn(val) {
  if ( isFunction(val) ) {
    return val(this);
  }

  return val;
}

export function colorForState(state, isError, isTransitioning) {
  if ( isError ) {
    return 'text-error';
  }

  if ( isTransitioning ) {
    return 'text-info';
  }

  const key = (state || 'active').toLowerCase();
  let color;

  if ( STATES[key] && STATES[key].color ) {
    color = maybeFn.call(this, STATES[key].color);
  }

  if ( !color ) {
    color = DEFAULT_COLOR;
  }

  return `text-${ color }`;
}

export function _getSchema(resource, { schemaFor }) {
  return schemaFor(resource.type);
}

export function _getStateDisplay({ state }) {
  // @TODO use translations
  const key = (state || 'active').toLowerCase();

  if ( REMAP_STATE[key] ) {
    return REMAP_STATE[key];
  }

  return key.split(/-/).map(ucFirst).join('-');
}

export function _getCreationTimestamp(resource) {
  return resource.metadata?.creationTimestamp;
}

export function _getStateObj(resource) {
  return resource.metadata?.state;
}

export function _getStateColor(resource, { colorForStateInModel = null }) {
  // this is a weird case wherein I couldn't figure out why the context binding was needed in the original so I did it this way just to be sure
  if (colorForStateInModel) {
    return colorForStateInModel;
  }

  return colorForState(
    resource.state,
    resource.stateObj?.error,
    resource.stateObj?.transitioning
  );
}

export function _getStateSort(resource) {
  const color = resource.stateColor.replace(/^(text|bg)-/, '');

  return `${ SORT_ORDER[color] || SORT_ORDER['other'] } ${ resource.stateDisplay }`;
}

export function _getNameDisplay(resource) {
  return resource.displayName || resource.spec?.displayName || resource.metadata?.annotations?.[NORMAN_NAME] || resource.name || resource.metadata?.name || resource.id;
}

export function _getNamespacedName(resource) {
  const namespace = resource.metadata?.namespace;
  const name = resource.nameDisplay;

  if ( namespace ) {
    return `${ namespace }:${ name }`;
  }

  return name;
}

export function _getNamespacedNameSort(resource) {
  return sortableNumericSuffix(resource.namespacedName).toLowerCase();
}

export function _getNameSort(resource) {
  return sortableNumericSuffix(resource.nameDisplay).toLowerCase();
}

export function _getGroupByLabel(resource, { translate }) {
  const name = resource.metadata?.namespace;
  let out;

  if ( name ) {
    out = translate ? translate('resourceTable.groupLabel.namespace', { name: escapeHtml(name) }) : name;
  } else {
    out = translate ? translate('resourceTable.groupLabel.notInANamespace') : '';
  }

  return out;
}

export function _getTypeDisplay(resource, { labelFor }) {
  const schema = resource.schema;

  if ( schema ) {
    return labelFor(schema);
  }

  return '?';
}

export const calculatedFields = [
  { name: 'schema', func: _getSchema },
  { name: 'stateDisplay', func: _getStateDisplay },
  { name: 'creationTimestamp', func: _getCreationTimestamp },
  { name: 'stateObj', func: _getStateObj },
  {
    name: 'stateColor', func: _getStateColor, dependsOn: ['stateObj']
  },
  {
    name: 'stateSort', func: _getStateSort, dependsOn: ['stateColor', 'stateDisplay']
  },
  { name: 'nameDisplay', func: _getNameDisplay },
  { name: 'namespacedName', func: _getNamespacedName },
  {
    name: 'namespacedNameSort', func: _getNamespacedNameSort, dependsOn: ['namespacedName']
  },
  {
    name: 'nameSort', func: _getNameSort, dependsOn: 'nameDisplay'
  },
  { name: 'groupByLabel', func: _getGroupByLabel },
  {
    name: 'typeDisplay', func: _getTypeDisplay, dependsOn: ['schema'], temptempCache: ['type-map']
  }
];
