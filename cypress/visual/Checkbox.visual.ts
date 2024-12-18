// import { expect } from '@storybook/test';
// import {composeStories} from '@storybook/testing-vue';
// import {mount} from '@cypress/vue';
// import * as stories from '../../storybook/src/stories/form/Checkbox.mdx';
// compile the "Simple" story with the library
// const { Checkbox } = composeStories(stories);

import storybook from "@/storybook/storybook-static/index.json";

// Retrieve all stories from the storybook build json, excluding docs and examples
const stories = Object.values(storybook.entries).filter(
  (entry) => entry.type === "story" && !entry.title.includes('Example'),
);

const filteredStories = stories.filter((story) => story.id.includes('stories-form-checkbox--default'));
filteredStories.forEach((story) => {
  describe(`${story.title} ${story.name}`, () => {
    it('should render correctly and have no regressions', () => {
      const URL = `/iframe.html?id=${story.id}`
      console.log(URL);
      // mount(<Checkbox />);
      cy.visit(URL)
      cy.get('#storybook-root').should('not.be.empty').toMatchImageSnapshot();
    });
  });
});
