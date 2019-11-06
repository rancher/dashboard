export function popupWindowOptions(width, height) {
  const s = window.screen;
  const opt = {
    width:      Math.min(s.width, width || 1040),
    height:     Math.min(s.height, height || 768),
    resizable:  1,
    scrollbars: 1,
  };

  opt.left = Math.max(0, (s.width - opt.width) / 2);
  opt.top = Math.max(0, (s.height - opt.height) / 2);

  const optStr = Object.keys(opt).map((k) => {
    return `${ k }=${ opt[k] }`;
  }).join(',');

  return optStr;
}

export function open(url, name = '_blank', opt = '') {
  return window.open(url, name, opt);
}
