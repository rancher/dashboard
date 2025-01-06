import storybook from "@/storybook/storybook-static/index.json";

const exceptions = ['IconIsDefault', 'Table']; // Stories to be excluded

// Retrieve all stories from the storybook build json, excluding docs and examples
const stories = Object.values(storybook.entries).filter(
  (entry) => entry.type === "story"
    && !entry.title.includes('Example')
    && exceptions.every(exception => !entry.title.includes(exception))
);

const filteredStories = stories;
filteredStories.forEach((story) => {
  describe(`${story.title} ${story.name}`, () => {
    it('should render correctly and have no regressions', () => {
      const URL = `/iframe.html?id=${story.id}`
      cy.visit(URL)
      cy.get('#storybook-root').should('not.be.empty').matchImageSnapshot();
    });
  });
});
