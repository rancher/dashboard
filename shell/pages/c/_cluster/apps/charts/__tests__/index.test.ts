import Charts from '@shell/pages/c/_cluster/apps/charts/index.vue';
import { UI_PLUGIN_ANNOTATION } from '@shell/config/uiplugins';

describe('page: Charts Index', () => {
  describe('computed: tagOptions', () => {
    it('should gather tags exclusively from enabledCharts, omitting tags from hidden or extension charts present in allCharts (e.g., primeOnly)', () => {
      const thisContext = {
        // allCharts contains a UI plugin/extension chart with the 'primeOnly' tag.
        allCharts: [
          { tags: ['appTag1'] },
          { tags: ['primeOnly'], annotations: { [UI_PLUGIN_ANNOTATION.NAME]: UI_PLUGIN_ANNOTATION.VALUE } },
        ],
        // enabledCharts has already filtered out the extension chart.
        enabledCharts: [
          { tags: ['appTag1'] },
        ]
      };

      const result = (Charts.computed!.tagOptions as () => any[]).call(thisContext);

      expect(result).toStrictEqual([
        { value: 'apptag1', label: 'appTag1' },
      ]);

      const hasPrimeOnly = result.some((tag) => tag.value === 'primeonly');

      expect(hasPrimeOnly).toBe(false);
    });
  });

  describe('computed: categoryOptions', () => {
    it('should gather categories exclusively from enabledCharts, omitting categories from hidden or extension charts present in allCharts', () => {
      const thisContext = {
        allCharts: [
          { categories: ['category1'] },
          { categories: ['categoryFromExtension1'], annotations: { [UI_PLUGIN_ANNOTATION.NAME]: UI_PLUGIN_ANNOTATION.VALUE } },
        ],
        enabledCharts: [
          { categories: ['category1'] },
        ],
        $store: { getters: { 'i18n/withFallback': (key: string, fallback: any, c: string) => c } }
      };

      const result = (Charts.computed!.categoryOptions as () => any[]).call(thisContext);

      expect(result).toStrictEqual([
        { value: 'category1', label: 'category1' },
      ]);

      const hasExtensionCategory = result.some((cat) => cat.value === 'categoryFromExtension1');

      expect(hasExtensionCategory).toBe(false);
    });
  });
});
