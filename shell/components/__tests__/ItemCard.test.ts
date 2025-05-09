// import { mount } from '@vue/test-utils';
// import ItemCard from '@shell/components/cards/ItemCard.vue';

// describe('component: ItemCard', () => {
//   const defaultProps = {
//     title:       'Test App',
//     description: 'A brief description of the test app.',
//     logo:        '/test-logo.png',
//     logoAltText: 'Test App Logo',
//     featured:    true,
//     asLink:      true,
//     deprecated:  true,
//     upgradable:  true,
//     installed:   true,
//     version:     '1.0.0',
//     repo:        'TestRepo',
//     categories:  ['Category1', 'Category2'],
//     tags:        ['Tag1', 'Tag2'],
//   };

//   let wrapper;

//   beforeEach(() => {
//     wrapper = mount(ItemCard, { props: defaultProps });
//   });

//   afterEach(() => {
//     wrapper.unmount();
//   });

//   it('renders all main props correctly', () => {
//     expect(wrapper.get('[data-testid="item-card-title"]').text()).toBe(defaultProps.title);
//     expect(wrapper.get('[data-testid="item-card-description"]').text()).toBe(defaultProps.description);
//     expect(wrapper.get('[data-testid="item-card-logo"]')).toBeTruthy();
//     expect(wrapper.get('[data-testid="item-card-version"]').text()).toContain(defaultProps.version);
//     expect(wrapper.get('[data-testid="item-card-repo"]').text()).toBe(defaultProps.repo);
//     expect(wrapper.findAll('[data-testid^="item-card-category-"]')).toHaveLength(defaultProps.categories.length);
//     expect(wrapper.findAll('[data-testid^="item-card-tag-"]')).toHaveLength(defaultProps.tags.length);
//   });

//   it('emits card-click when card is clicked (outside actionable areas)', async() => {
//     await wrapper.get('[data-testid="item-card"]').trigger('click');
//     expect(wrapper.emitted('card-click')).toBeTruthy();
//   });

//   it('does not emit card-click when an actionable area is clicked', async() => {
//     await wrapper.get('[data-testid="item-card-repo"]').trigger('click');
//     expect(wrapper.emitted('card-click')).toBeFalsy();
//   });

//   it('emits repo-click with correct value', async() => {
//     await wrapper.get('[data-testid="item-card-repo-text"]').trigger('click');
//     expect(wrapper.emitted('repo-click')[0]).toStrictEqual([defaultProps.repo]);
//   });

//   it('emits category-click for each category', async() => {
//     for (const [i, category] of defaultProps.categories.entries()) {
//       await wrapper.get(`[data-testid="item-card-category-${ i }"]`).trigger('click');
//       expect(wrapper.emitted('category-click')[i]).toStrictEqual([category]);
//     }
//   });

//   it('emits tag-click for each tag', async() => {
//     for (const [i, tag] of defaultProps.tags.entries()) {
//       await wrapper.get(`[data-testid="item-card-tag-${ i }"]`).trigger('click');
//       expect(wrapper.emitted('tag-click')[i]).toStrictEqual([tag]);
//     }
//   });

//   it('repo, tags, and categories are keyboard accessible', async() => {
//     await wrapper.get('[data-testid="item-card-repo-text"]').trigger('keydown.enter');
//     expect(wrapper.emitted('repo-click')).toBeTruthy();

//     await wrapper.get('[data-testid="item-card-category-0"]').trigger('keydown.enter');
//     expect(wrapper.emitted('category-click')).toBeTruthy();

//     await wrapper.get('[data-testid="item-card-tag-0"]').trigger('keydown.enter');
//     expect(wrapper.emitted('tag-click')).toBeTruthy();
//   });
// });
