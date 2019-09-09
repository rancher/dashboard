export const platform = (typeof window !== 'undefined' && window.navigator && window.navigator.platform ? window.navigator.platform.toLowerCase() : 'server');
export const userAgent = (typeof window !== 'undefined' && window.navigator && window.navigator.userAgent ? window.navigator.userAgent : 'server');

export const isLinuxy = platform.indexOf('linux') >= 0 || platform.indexOf('unix') >= 0;
export const isMac = platform.indexOf('mac') >= 0;
export const isWin = platform.indexOf('win') >= 0;

export const alternateKey = (isMac ? 'metaKey' : 'ctrlKey');
export const alternateLabel = (isMac ? 'Command' : 'Control');

export const moreKey = alternateKey;
export const moreLabel = alternateLabel;

export const rangeKey = 'shiftKey';
export const rangeLabel = 'Shift';

export function isAlternate(event) {
  return !!event[alternateKey];
}

export function isMore(event) {
  return !!event[moreKey];
}

export function isRange(event) {
  return !!event[rangeKey];
}

export function suppressContextMenu(event) {
  return event.ctrlKey && event.button === 2;
}

// Only intended to work for Mobile Safari at the moment...
export function version() {
  const match = userAgent.match(/\s+Version\/([0-9.]+)/);

  if ( match ) {
    return parseFloat(match[1]);
  }

  return null;
}

export const isGecko = userAgent.indexOf('Gecko/') >= 0;
export const isBlink = userAgent.indexOf('Chrome/') >= 0;
export const isWebKit = !isBlink && userAgent.indexOf('AppleWebKit/') >= 0;
export const isSafari = !isBlink && userAgent.indexOf('Safari/') >= 0;
export const isMobile = /Android|webOS|iPhone|iPad|iPod|IEMobile/i.test(userAgent);

export const KEY = {
  LEFT:      37,
  UP:        38,
  RIGHT:     39,
  DOWN:      40,
  ESCAPE:    27,
  CR:        13,
  LF:        10,
  TAB:       9,
  SPACE:     32,
  PAGE_UP:   33,
  PAGE_DOWN: 34,
  HOME:      35,
  END:       36,
};
