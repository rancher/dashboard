import { addons } from '@storybook/addons';
import rancherTheme from './theme';
import installShortcut from './theme-shortcut';

addons.setConfig({
  panelPosition: 'right',
  theme: rancherTheme
});

const loader = window.onload;
window.onload = () => {
  const ch = addons.getChannel();
  ch.on('shortcut-toggle-dark-mode', (a) => {
    const toolbar = document.getElementsByClassName('os-content');
    if (toolbar.length > 2) {
      const aTags = toolbar[1].getElementsByTagName("button");
      const searchText = "Change theme to ";
      let found;

      for (var i = 0; i < aTags.length; i++) {
        if (aTags[i].title && aTags[i].title.indexOf(searchText) === 0) {
          found = aTags[i];
          break;
        }
      }

      if (found) {
        found.click();
      }
    }
  });

  // Add keyboard shortcut to toggle between dark and light modes
  installShortcut();

  if (loader) {
    loader();
  }
}
