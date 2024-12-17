// import { expect } from '@storybook/test';
// import {composeStories} from '@storybook/testing-vue';
// import {mount} from '@cypress/vue';
// import * as stories from '../../storybook/src/stories/form/Checkbox.mdx';

// compile the "Simple" story with the library
// const { Checkbox } = composeStories(stories);

describe('Checkbox component', () => {
  it('should render correctly', () => {
    // mount(<Checkbox />);
    cy.visit('/iframe.html?id=stories-form-checkbox--default')
    const container = cy.get('#storybook-root')
    container.should('not.be.empty');
    cy.get('#storybook-root').toMatchImageSnapshot();
  });
});
