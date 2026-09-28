// CodeMirror reads the platform once, when @codemirror/view loads, to decide whether Mod- key bindings mean
// Cmd (macOS) or Ctrl, and which platform-specific bindings apply. jsdom leaves navigator.platform empty,
// which matches no platform. The platform-*.ts modules call this, and a test file imports one of them
// before anything that loads CodeMirror.
export function setPlatform(platform: string): void {
  Object.defineProperty(window.navigator, 'platform', { value: platform, configurable: true });
}
