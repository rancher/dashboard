import { addons } from '@storybook/addons';

// Insall keyboard shortcut to change theme
export default function() {
  const platform = window.navigator.platform;
  const isMac = platform.indexOf('Mac') === 0;

  document.onkeyup = function(e) {
    const modifier = isMac ? e.altKey : e.ctrlKey;
    if (modifier && e.which === 84) {
      const ch = addons.getChannel();
      ch.emit('shortcut-toggle-dark-mode');
    }
  };
}