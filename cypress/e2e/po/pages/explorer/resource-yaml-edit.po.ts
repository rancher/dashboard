import PagePo from '@/cypress/e2e/po/pages/page.po';
import BannersPo from '@/cypress/e2e/po/components/banners.po';
import MultiResourceYamlPo from '@/cypress/e2e/po/components/multi-resource-yaml.po';
import ResourceYamlPo from '@/cypress/e2e/po/components/resource-yaml.po';

const YAML_PARAMS = {
  edit: 'mode=edit&as=yaml',
  view: 'as=yaml',
};

/**
 * The page showing a resource as YAML
 *
 * When editing, it shows the multi-resource YAML editor when the resource has related resources and
 * the single-resource editor otherwise. When viewing, it always shows the single-resource editor
 */
export default class ResourceYamlEditPagePo extends PagePo {
  private params: string;

  /**
   * @param type the steve type of the resource
   * @param id the steve id of the resource, `namespace/name` for a namespaced type
   * @param options.clusterId the cluster of the resource, `_` for a resource of the cluster manager
   * @param options.product the product the page is in, such as `explorer` or `manager`
   * @param options.mode edit the resource, or view it
   */
  constructor(type: string, id: string, { clusterId = 'local', product = 'explorer', mode = 'edit' as 'edit' | 'view' } = {}) {
    super(`/c/${ clusterId }/${ product }/${ type }/${ id }`);
    this.params = YAML_PARAMS[mode];
  }

  goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(this.params);
  }

  waitForPage(): Cypress.Chainable {
    return super.waitForPage(this.params);
  }

  multiResourceYaml(): MultiResourceYamlPo {
    return new MultiResourceYamlPo();
  }

  singleResourceYaml(): ResourceYamlPo {
    return new ResourceYamlPo();
  }

  /**
   * The first error the page shows, for example from a failed save
   */
  errorBanner(): BannersPo {
    return new BannersPo('[data-testid="error-banner0"]');
  }
}
