import {
  STATE_COLOR, STATE_TYPE,
  StateDetails, StateInfoForTypes, STATES_ENUM
} from './types/rancher-api-types';
import forIn from 'lodash/forIn';
import { STATES, DEFAULT_COLOR, REMAP_STATE, SORT_ORDER } from './resource-constants';
import isFunction from 'lodash/isFunction';
import { ucFirst } from '@/shell/utils/string';
import Resource from './resource-class';

export function getStatesByType(): StateInfoForTypes {
  const out: StateInfoForTypes = {
    info:    [],
    error:   [],
    success: [],
    warning: [],
    unknown: [],
    darker:  [],
    never:   []
  };

  forIn(STATES, (state: any, stateKey: any) => {
    try {
      const color: STATE_COLOR = state.color;

      out[color].push(stateKey);
    } catch (err) {
      out.unknown.push(stateKey);
    }
  });

  return out;
}

export function getStateLabel(state: STATE_TYPE): string {
  const lowercaseState = state.toLowerCase();
  const stateDetails: StateDetails = STATES[lowercaseState];

  if (stateDetails) {
    return stateDetails.label || '';
  }

  const unknownStateDetails: StateDetails = STATES.unknown;

  return unknownStateDetails.label || '';
}

export function colorForState(state: STATE_TYPE | string, isError: boolean, isTransitioning: boolean): string {
  if ( isError ) {
    return 'text-error';
  }

  if ( isTransitioning ) {
    return 'text-info';
  }

  const key = (state || 'active').toLowerCase();
  let color;

  if ( STATES[key] && STATES[key].color ) {
    color = STATES[key].color;
  }

  if ( !color ) {
    color = DEFAULT_COLOR;
  }

  return `text-${ color }`;
}

export function stateDisplay(state: STATES_ENUM): string {
  // @TODO use translations
  const key = (state || 'active').toLowerCase();

  if ( REMAP_STATE[key] ) {
    return REMAP_STATE[key];
  }

  return key.split(/-/).map(ucFirst).join('-');
}

export function stateSort(color: string, display: string): string {
  color = color.replace(/^(text|bg)-/, '');

  // eslint-disable-next-line
  return `${ SORT_ORDER[color] || SORT_ORDER['other'] } ${ display }`;
}
