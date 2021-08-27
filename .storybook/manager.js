// .storybook/manager.js

import { addons } from '@storybook/addons';
import rancherTheme from './theme';

addons.setConfig({
  panelPosition: 'right',
  theme: rancherTheme
});


// let firstLoad = true;
// addons.register('my-organisation/my-addon', (storybookAPI) => {
//   storybookAPI.on(SET_CURRENT_STORY, ((kind, story) => {

//     console.log('<<<<<<<<<<<<<<<<<<<<<<<<<');
//     // when you enter a story, if you are just loading storybook up, default to a specific kind/story. 
//     if (firstLoad) {
//       firstLoad = false; // make sure to set this flag to false, otherwise you will never be able to look at another story.

//       console.log('selecting story....');
//       console.log(kind);
//       console.log(story);
//       storybookAPI.selectStory('BadgeState', 'Primary');
//     }
//   }));
// });
