import { mount } from '@vue/test-utils';
import ClusterRepoBranch from '@shell/components/formatter/ClusterRepoBranch.vue';

const notApplicableTranslationKey = '%generic.na%';

describe('component: ClusterRepoBranch', () => {
  it.each([
    [{ isOciType: false, spec: { url: 'https://git.rancher.io/charts', gitBranch: 'dev-v2.10' } }, 'dev-v2.10'],
    [{ isOciType: false, spec: { url: 'https://git.rancher.io/charts', gitBranch: 'main' } }, 'main'],
    [{ isOciType: false, spec: { url: '', gitBranch: 'main' } }, 'main'],
    [{ isOciType: false, spec: { url: '', gitBranch: '' } }, '—'],
    [{ isOciType: false, spec: { url: '' } }, '—'],
    [{ isOciType: true, spec: { url: 'oci://' } }, notApplicableTranslationKey],
    [{ isOciType: true, spec: { url: 'oci://', gitBranch: 'main' } }, notApplicableTranslationKey],
    [{ isOciType: true, spec: { url: '' } }, notApplicableTranslationKey],
    [{ }, '—'],
    [undefined, '—'],
  ])('should display correct branch', async(clusterRepo, expectedBranchTextToShow) => {
    const wrapper = await mount(ClusterRepoBranch, { props: { value: clusterRepo, col: { dashIfEmpty: true } } });
    const element = wrapper.find('span');

    expect(element.text()).toBe(expectedBranchTextToShow);
  });
});
