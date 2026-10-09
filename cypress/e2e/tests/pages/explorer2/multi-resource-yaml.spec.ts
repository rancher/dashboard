import ResourceYamlEditPagePo from '@/cypress/e2e/po/pages/explorer/resource-yaml-edit.po';
import ResourceYamlEditorPagePo from '@/cypress/e2e/po/pages/explorer/yaml-editor.po';
import { WorkloadsDeploymentsListPagePo } from '@/cypress/e2e/po/pages/explorer/workloads/workloads-deployments.po';
import { ConfigMapListPagePo } from '@/cypress/e2e/po/pages/explorer/config-map.po';
import DetailDrawer from '@/cypress/e2e/po/side-bars/detail-drawer.po';
import ResourceYamlPo from '@/cypress/e2e/po/components/resource-yaml.po';
import MultiResourceYamlPo from '@/cypress/e2e/po/components/multi-resource-yaml.po';
import { browsingFixtures, Fixture, routeFixture, savingFixtures } from '@/cypress/e2e/blueprints/explorer/multi-resource-yaml';

const cluster = 'local';

describe('Multi-resource YAML editor', { testIsolation: false, tags: ['@explorer2', '@adminUser', '@standardUser'] }, () => {
  // created for these tests, in a project the user is a member of so the user can see it
  let namespace = '';

  const editPage = (type: string, name: string) => new ResourceYamlEditPagePo(type, `${ namespace }/${ name }`);

  /** Open the YAML of a resource of `namespace` for editing */
  const openEditor = (type: string, name: string) => {
    const page = editPage(type, name);

    page.goTo();
    page.waitForPage();
    page.multiResourceYaml().checkVisible();

    return page;
  };

  const createFixtures = (fixtures: Fixture[]) => fixtures.forEach(([type, body]) => {
    cy.createRancherResource('v1', type, JSON.stringify(body));
  });

  /**
   * Create the resources of one saving test, named for the test and its attempt
   *
   * each attempt edits resources of its own, so a retry does not see an edit an earlier attempt saved
   *
   * @returns the start of the names of the resources
   */
  const createSavingFixtures = (prefix: string): string => {
    const attemptPrefix = `${ prefix }-${ Cypress.currentRetry }`;

    createFixtures(savingFixtures(namespace, attemptPrefix));

    return attemptPrefix;
  };

  /**
   * Wait until the user may create resources in `namespace`
   *
   * Rancher grants the roles of a project in a namespace created in it in the background, so a
   * project member is refused for a moment after creating one
   */
  const waitUntilNamespaceWritable = (attemptsLeft = 30): void => {
    // through the kubernetes api, as steve adds metadata to what it creates, which an access review must not have
    cy.getCookie('CSRF').then((csrf) => cy.request({
      method:  'POST',
      url:     `${ Cypress.env('api') }/k8s/clusters/${ cluster }/apis/authorization.k8s.io/v1/selfsubjectaccessreviews`,
      headers: { 'x-api-csrf': csrf?.value, Accept: 'application/json' },
      body:    {
        apiVersion: 'authorization.k8s.io/v1',
        kind:       'SelfSubjectAccessReview',
        spec:       {
          resourceAttributes: {
            namespace, verb: 'create', resource: 'configmaps'
          }
        }
      },
    })).then((resp) => {
      if (!resp.body?.status?.allowed) {
        expect(attemptsLeft, `create permission in namespace ${ namespace }`).to.be.greaterThan(0);
        cy.wait(1000); // eslint-disable-line cypress/no-unnecessary-waiting
        waitUntilNamespaceWritable(attemptsLeft - 1);
      }
    });
  };

  before(() => {
    cy.login();

    cy.createE2EResourceName('multi-yaml').then((name) => {
      namespace = name;

      cy.getRancherResource('v3', `projects?clusterId=${ cluster }`).then((resp: any) => {
        const projects = resp.body.data;
        const project = projects.find((p: any) => p.name === 'Default') || projects[0];

        // not `createNamespaceInProject`: it sets pod security labels, which a project member may not set
        cy.createRancherResource('v1', 'namespaces', JSON.stringify({
          metadata: {
            name:        namespace,
            annotations: { 'field.cattle.io/projectId': project.id },
            labels:      { 'field.cattle.io/projectId': project.id.split(':')[1] },
          }
        }));
      });

      cy.then(() => waitUntilNamespaceWritable());

      cy.then(() => createFixtures(browsingFixtures(namespace)));

      // the StatefulSet controller creates the claim of its first replica from the volume claim template
      cy.then(() => cy.waitForRancherResource('v1', 'persistentvolumeclaims', `${ namespace }/data-db-0`, (resp: any) => resp.status === 200, 20, { failOnStatusCode: false }));
    });
  });

  after(() => {
    // with no name the request would be made to the namespace collection
    if (namespace) {
      cy.deleteRancherResource('v1', 'namespaces', namespace, false);
    }
  });

  describe('opening the editor', () => {
    it('opens the multi-resource editor from Edit YAML for a resource with related resources', () => {
      const listPage = new WorkloadsDeploymentsListPagePo(cluster);
      const page = editPage('apps.deployment', 'web');

      WorkloadsDeploymentsListPagePo.navTo(cluster);
      listPage.waitForPage();
      listPage.goToEditYamlPage('web');
      page.waitForPage();

      page.multiResourceYaml().checkVisible();
      page.singleResourceYaml().checkNotExists();
    });

    it('opens the single-resource editor from Edit YAML for a resource with no related resources', () => {
      const listPage = new ConfigMapListPagePo(cluster);
      const page = editPage('configmap', 'lonely');

      ConfigMapListPagePo.navTo(cluster);
      listPage.waitForPage();
      listPage.goToEditYamlPage('lonely');
      page.waitForPage();

      page.singleResourceYaml().checkVisible();
      page.multiResourceYaml().checkNotExists();
    });

    it('opens the single-resource editor when creating a resource', () => {
      const page = new ResourceYamlEditPagePo('configmap', 'create', { clusterId: cluster });

      ResourceYamlEditorPagePo.goTo('configmap', cluster);

      page.singleResourceYaml().checkVisible();
      page.multiResourceYaml().checkNotExists();
    });

    it('shows the read-only single-resource editor when viewing the YAML of a resource with related resources', () => {
      // the detail page links to no YAML view, so the page is opened from its url
      const page = new ResourceYamlEditPagePo('apps.deployment', `${ namespace }/web`, { clusterId: cluster, mode: 'view' });

      page.goTo();
      page.waitForPage();

      page.singleResourceYaml().checkVisible();
      page.singleResourceYaml().checkReadOnly();
      page.multiResourceYaml().checkNotExists();
    });

    it('shows the read-only single-resource editor in the YAML tab of the configuration drawer of a resource with related resources', () => {
      const listPage = new WorkloadsDeploymentsListPagePo(cluster);
      const drawer = new DetailDrawer();

      WorkloadsDeploymentsListPagePo.navTo(cluster);
      // exact: the previous test left a page whose url starts with the url of the list
      listPage.waitForPageWithExactUrl();
      listPage.showConfiguration('web');
      drawer.checkVisible();
      drawer.tabs().clickTabWithName('yaml-tab');

      // made once the drawer is open, as `drawer.self()` queries the page when it is called
      const yaml = new ResourceYamlPo(drawer.self());

      // not `checkVisible`: the editor is taller than the viewport, inside the fixed drawer,
      // and cypress reports an element in a fixed container as hidden when its centre is off-screen
      yaml.checkExists();
      yaml.codeMirror().value().should('contain', 'name: web');
      yaml.checkReadOnly();
      new MultiResourceYamlPo().checkNotExists();
    });
  });

  describe('resource graph', () => {
    it('shows the primary resource first, with a count of every resource in the graph', () => {
      const graph = openEditor('apps.deployment', 'web').multiResourceYaml().resourceGraph();

      graph.nodeLabels().first().should('have.text', 'web');

      // the count includes the collapsed read-only section, which holds the ReplicaSet the Deployment controls
      graph.referencedSection().toggle();
      graph.referencedSection().checkExpanded();
      graph.nodeLabels().its('length').then((shown) => {
        graph.count().should('have.text', String(shown));
      });
    });

    it('shows each related resource below the resource that refers to it', () => {
      const graph = openEditor('autoscaling.horizontalpodautoscaler', 'web').multiResourceYaml().resourceGraph();

      graph.node('apps.deployment', `${ namespace }/web`).nestedLabels().should('contain', 'app-config').and('contain', 'registry-pull');
    });

    it('shows the related resources under a heading for their type', () => {
      const graph = openEditor('apps.deployment', 'web').multiResourceYaml().resourceGraph();
      const headings = graph.relatedSection().groupLabels();

      ['ConfigMap', 'Secret', 'PersistentVolumeClaim', 'ServiceAccount'].forEach((heading) => headings.should('contain', heading));
    });

    it('shows a resource reachable from two resources once, below the first to reach it', () => {
      // the autoscaler scales the Deployment, and reads a metric of the Ingress routing to its Service
      const graph = openEditor('autoscaling.horizontalpodautoscaler', 'web').multiResourceYaml().resourceGraph();

      graph.nodeCount('apps.deployment', `${ namespace }/web`).should('eq', 1);
      graph.node('apps.deployment', `${ namespace }/web`).checkVisible();
    });

    it('expands the related section by default', () => {
      openEditor('apps.deployment', 'web').multiResourceYaml().resourceGraph().relatedSection()
        .checkExpanded();
    });

    it('collapses the referenced section by default, and expands it from its toggle', () => {
      // the provisioning cluster of the local cluster shows its management cluster for reference
      const page = new ResourceYamlEditPagePo('provisioning.cattle.io.cluster', 'fleet-local/local', { clusterId: '_', product: 'manager' });
      const referenced = page.multiResourceYaml().resourceGraph().referencedSection();

      page.goTo();
      page.waitForPage();

      referenced.checkExpanded(false);
      referenced.nodeLabels().should('not.exist');

      referenced.toggle();

      referenced.checkExpanded();
      referenced.nodeLabels().should('contain', 'local');
    });

    it('shows the ReplicaSet a Deployment controls read-only, with a banner naming the Deployment', () => {
      const multi = openEditor('apps.deployment', 'web').multiResourceYaml();
      const readOnly = multi.resourceGraph().referencedSection();

      // created through the api, so nothing else writes the Deployment
      multi.managementBanner().checkNotExists();

      readOnly.toggle();
      readOnly.nodeLabels().contains(/^web-/).click();

      multi.checkReadOnly();
      multi.managementBanner().banner().should('contain', 'The Deployment web controls this resource');
      // the Deployment is already open in the editor
      multi.managementBanner().self().find('a').should('not.exist');
    });
  });

  describe('related resources found from the schema', () => {
    it('shows the Secrets, ConfigMaps, PersistentVolumeClaim and ServiceAccount the pod template of a Deployment names', () => {
      const labels = openEditor('apps.deployment', 'web').multiResourceYaml().resourceGraph().relatedSection()
        .nodeLabels();

      ['app-config', 'app-env', 'app-credentials', 'registry-pull', 'uploads', 'app'].forEach((name) => labels.should('contain', name));
    });

    it('shows the workload a HorizontalPodAutoscaler scales, and the object of an Object metric', () => {
      const graph = openEditor('autoscaling.horizontalpodautoscaler', 'web').multiResourceYaml().resourceGraph();

      graph.node('apps.deployment', `${ namespace }/web`).checkVisible();
      graph.node('networking.k8s.io.ingress', `${ namespace }/web`).checkVisible();
    });

    it('shows the source claim of a PersistentVolumeClaim cloned from another claim', () => {
      const graph = openEditor('persistentvolumeclaim', 'uploads-clone').multiResourceYaml().resourceGraph();

      graph.node('persistentvolumeclaim', `${ namespace }/uploads`).checkVisible();
    });

    it('shows the Services and the extensionRef ConfigMap of an HTTPRoute, including the Service of a request mirror', function() {
      cy.request({ url: `${ Cypress.env('api') }/v1/schemas/gateway.networking.k8s.io.httproute`, failOnStatusCode: false }).then((resp) => {
        if (resp.status !== 200) {
          // the cluster has no gateway api, or the user can not see it
          this.skip();
        }

        createFixtures([routeFixture(namespace)]);
      });

      const graph = openEditor('gateway.networking.k8s.io.httproute', 'web-route').multiResourceYaml().resourceGraph();

      graph.node('service', `${ namespace }/web`).checkVisible();
      graph.node('service', `${ namespace }/db`).checkVisible();
      graph.node('configmap', `${ namespace }/app-config`).checkVisible();
    });

    it('shows no resource for a reference to a type the user can not get', () => {
      // the autoscaler reads a metric of a `Widget`, a kind the cluster does not have
      const graph = openEditor('autoscaling.horizontalpodautoscaler', 'web').multiResourceYaml().resourceGraph();

      graph.node('networking.k8s.io.ingress', `${ namespace }/web`).checkVisible();
      graph.nodeLabels().should('not.contain', 'unknown-widget');
    });

    it('shows no resource for a reference to a resource that does not exist', () => {
      // the pod template reads an optional Secret that was never created
      const graph = openEditor('apps.deployment', 'web').multiResourceYaml().resourceGraph();

      graph.node('secret', `${ namespace }/app-credentials`).checkVisible();
      graph.nodeLabels().should('not.contain', 'missing-secret');
    });
  });

  describe('related resources found by the models', () => {
    it('shows the Services, HorizontalPodAutoscalers, PodDisruptionBudgets and NetworkPolicies of a Deployment when it is the primary resource', () => {
      const graph = openEditor('apps.deployment', 'web').multiResourceYaml().resourceGraph();

      graph.node('service', `${ namespace }/web`).checkVisible();
      graph.node('autoscaling.horizontalpodautoscaler', `${ namespace }/web`).checkVisible();
      graph.node('policy.poddisruptionbudget', `${ namespace }/web`).checkVisible();
      graph.node('networking.k8s.io.networkpolicy', `${ namespace }/web-allow`).checkVisible();
    });

    it('does not show the dependents of a related resource', () => {
      // the Deployment is a dependency of the autoscaler, so its PodDisruptionBudget is not shown
      const graph = openEditor('autoscaling.horizontalpodautoscaler', 'web').multiResourceYaml().resourceGraph();

      graph.node('apps.deployment', `${ namespace }/web`).checkVisible();
      graph.node('policy.poddisruptionbudget', `${ namespace }/web`).checkNotExists();
      graph.node('networking.k8s.io.networkpolicy', `${ namespace }/web-allow`).checkNotExists();
    });

    it('shows the claims a StatefulSet created from its volume claim templates, with a banner naming the template', () => {
      const multi = openEditor('apps.statefulset', 'db').multiResourceYaml();
      const claim = multi.resourceGraph().node('persistentvolumeclaim', `${ namespace }/data-db-0`);

      claim.select();
      claim.checkSelected();

      multi.banner().banner().should('contain', 'volume claim template "data"');
    });

    it('shows the workloads that use a PersistentVolumeClaim when it is the primary resource', () => {
      const graph = openEditor('persistentvolumeclaim', 'uploads').multiResourceYaml().resourceGraph();

      graph.node('apps.deployment', `${ namespace }/web`).checkVisible();
    });
  });

  describe('selection and editing', () => {
    it('shows the YAML of the resource selected in the graph', () => {
      const multi = openEditor('apps.deployment', 'web').multiResourceYaml();
      const config = multi.resourceGraph().node('configmap', `${ namespace }/app-config`);

      config.select();

      config.checkSelected();
      multi.yaml().should('contain', 'name: app-config');
    });

    it('keeps the edits made to a resource while another resource is selected', () => {
      const multi = openEditor('apps.deployment', 'web').multiResourceYaml();
      const graph = multi.resourceGraph();

      graph.node('configmap', `${ namespace }/app-config`).select();
      multi.editYaml((yaml) => yaml.replace('key: value', 'key: edited'));
      graph.node('secret', `${ namespace }/app-credentials`).select();
      graph.node('configmap', `${ namespace }/app-config`).select();

      multi.yaml().should('contain', 'key: edited');
    });

    it('marks an edited resource as edited in the graph', () => {
      const multi = openEditor('apps.deployment', 'web').multiResourceYaml();
      const config = multi.resourceGraph().node('configmap', `${ namespace }/app-config`);

      config.select();
      config.checkModified(false);
      multi.editYaml((yaml) => yaml.replace('key: value', 'key: edited'));

      config.checkModified();
      config.modifiedBadge().should('be.visible');
    });

    it('clears the edited mark when the YAML is changed back', () => {
      const multi = openEditor('apps.deployment', 'web').multiResourceYaml();
      const config = multi.resourceGraph().node('configmap', `${ namespace }/app-config`);

      config.select();
      multi.editYaml((yaml) => yaml.replace('key: value', 'key: edited'));
      config.checkModified();
      multi.editYaml((yaml) => yaml.replace('key: edited', 'key: value'));

      config.checkModified(false);
    });

    it('shows a read-only resource in view mode, with no save button', () => {
      // the provisioning cluster of the local cluster shows its management cluster for reference
      const page = new ResourceYamlEditPagePo('provisioning.cattle.io.cluster', 'fleet-local/local', { clusterId: '_', product: 'manager' });
      const multi = page.multiResourceYaml();
      const managementCluster = multi.resourceGraph().node('management.cattle.io.cluster', 'local');

      page.goTo();
      page.waitForPage();
      multi.resourceGraph().referencedSection().toggle();
      managementCluster.select();

      managementCluster.checkReadOnly();
      multi.checkReadOnly();
      managementCluster.saveButton().should('not.exist');
    });

    it('shows the banner of a related resource while it is selected', () => {
      const multi = openEditor('apps.statefulset', 'db').multiResourceYaml();
      const graph = multi.resourceGraph();

      graph.node('persistentvolumeclaim', `${ namespace }/data-db-0`).select();
      multi.banner().banner().should('contain', 'volume claim template "data"');

      graph.node('secret', `${ namespace }/app-credentials`).select();
      multi.banner().checkNotExists();
    });
  });

  describe('diff', () => {
    /** Open the Deployment, select its ConfigMap and edit it */
    const editConfig = () => {
      const multi = openEditor('apps.deployment', 'web').multiResourceYaml();

      multi.resourceGraph().node('configmap', `${ namespace }/app-config`).select();
      multi.editYaml((yaml) => yaml.replace('key: value', 'key: edited'));

      return multi;
    };

    it('shows the diff toggle only while the selected resource is edited', () => {
      const multi = openEditor('apps.deployment', 'web').multiResourceYaml();

      multi.resourceGraph().node('configmap', `${ namespace }/app-config`).select();
      multi.diffToggle().should('not.exist');

      multi.editYaml((yaml) => yaml.replace('key: value', 'key: edited'));

      multi.diffToggle().should('be.visible');
    });

    it('shows the diff of the selected resource against the YAML it was opened with', () => {
      const multi = editConfig();

      multi.diffToggle().click();

      multi.diff().should('contain', 'key: value').and('contain', 'key: edited');
      multi.codeMirror().checkNotExists();
    });

    it('switches the diff between unified and split', () => {
      const multi = editConfig();

      // the diff opens in the mode last chosen, a user preference kept between runs
      multi.diffToggle().click();
      multi.showSplitDiff();
      multi.checkDiffMode('split');

      multi.showUnifiedDiff();
      multi.checkDiffMode('unified');
    });

    it('leaves the diff when another resource is selected', () => {
      const multi = editConfig();

      multi.diffToggle().click();
      multi.diff().should('be.visible');
      multi.resourceGraph().node('secret', `${ namespace }/app-credentials`).select();

      multi.diff().should('not.exist');
      multi.codeMirror().checkVisible();
    });
  });

  describe('saving one resource', () => {
    /**
     * Open the Deployment of the saving fixtures named `prefix`, and edit its ConfigMap and Secret
     */
    const editConfigAndSecret = (prefix: string) => {
      const multi = openEditor('apps.deployment', `${ prefix }-app`).multiResourceYaml();
      const graph = multi.resourceGraph();

      graph.node('secret', `${ namespace }/${ prefix }-secret`).select();
      // `ZWRpdGVk` is `edited`, base64 encoded
      multi.editYaml((yaml) => yaml.replace('\ndata:\n', '\ndata:\n  extra: ZWRpdGVk\n'));
      graph.node('configmap', `${ namespace }/${ prefix }-config`).select();
      multi.editYaml((yaml) => yaml.replace('key: value', 'key: edited'));

      return multi;
    };

    it('saves only the resource whose save button is clicked, and stays in the editor', () => {
      const prefix = createSavingFixtures('save-one');
      const multi = editConfigAndSecret(prefix);
      const page = editPage('apps.deployment', `${ prefix }-app`);

      cy.intercept('PUT', `**/v1/configmaps/${ namespace }/${ prefix }-config*`).as('saveConfig');
      multi.resourceGraph().node('configmap', `${ namespace }/${ prefix }-config`).save();
      cy.wait('@saveConfig').its('response.statusCode').should('eq', 200);

      page.waitForPage();
      cy.getRancherResource('v1', 'configmaps', `${ namespace }/${ prefix }-config`).its('body.data.key').should('eq', 'edited');
      cy.getRancherResource('v1', 'secrets', `${ namespace }/${ prefix }-secret`).its('body.data').should('not.have.property', 'extra');
    });

    it('clears the edited mark of the saved resource and shows its saved YAML', () => {
      const prefix = createSavingFixtures('save-mark');
      const multi = editConfigAndSecret(prefix);
      const config = multi.resourceGraph().node('configmap', `${ namespace }/${ prefix }-config`);

      config.save();

      config.checkModified(false);
      multi.yaml().should('contain', 'key: edited');
    });

    it('keeps the edits made to the other resources', () => {
      const prefix = createSavingFixtures('save-keep');
      const multi = editConfigAndSecret(prefix);
      const graph = multi.resourceGraph();
      const secret = graph.node('secret', `${ namespace }/${ prefix }-secret`);

      graph.node('configmap', `${ namespace }/${ prefix }-config`).save();
      graph.node('configmap', `${ namespace }/${ prefix }-config`).checkModified(false);

      secret.checkModified();
      secret.select();
      multi.yaml().should('contain', 'extra: ZWRpdGVk');
    });

    it('shows the error of a failed save, and keeps the edits', () => {
      const prefix = createSavingFixtures('save-error');
      const page = editPage('apps.deployment', `${ prefix }-app`);
      const multi = editConfigAndSecret(prefix);
      const config = multi.resourceGraph().node('configmap', `${ namespace }/${ prefix }-config`);

      // a renamed resource is saved to a resource that does not exist, which the server refuses
      multi.editYaml((yaml) => yaml.replace(`\n  name: ${ prefix }-config\n`, '\n  name: save-error-renamed\n'));
      config.save();

      page.errorBanner().banner().should('be.visible');
      config.checkModified();
      multi.yaml().should('contain', 'name: save-error-renamed');
    });

    it('disables every save button while a save is running', () => {
      const prefix = createSavingFixtures('busy');
      const multi = editConfigAndSecret(prefix);
      const graph = multi.resourceGraph();

      cy.intercept('PUT', `**/v1/configmaps/${ namespace }/${ prefix }-config*`, (req) => {
        req.on('response', (res) => {
          res.setDelay(3000);
        });
      }).as('slowSave');
      graph.node('configmap', `${ namespace }/${ prefix }-config`).save();

      graph.node('secret', `${ namespace }/${ prefix }-secret`).saveButton().should('be.disabled');

      cy.wait('@slowSave');

      graph.node('secret', `${ namespace }/${ prefix }-secret`).saveButton().should('be.enabled');
    });
  });

  describe('saving every resource', () => {
    /**
     * Change a ConfigMap of `namespace` through the api, as another user would while it is open
     * in the editor
     */
    const changeConfigMapInBackground = (name: string, change: (configMap: any) => void) => {
      cy.getRancherResource('v1', 'configmaps', `${ namespace }/${ name }`).then((resp: any) => {
        // steve adds these to the resources it sends, they are not part of the resource
        const {
          id, type, links, actions, ...configMap
        } = resp.body;

        delete configMap.metadata.fields;
        delete configMap.metadata.relationships;
        delete configMap.metadata.state;
        change(configMap);

        cy.setRancherResource('v1', 'configmaps', `${ namespace }/${ name }`, configMap);
      });
    };

    it('disables Save All until a resource is edited', () => {
      const prefix = createSavingFixtures('save-all');
      const multi = openEditor('apps.deployment', `${ prefix }-app`).multiResourceYaml();

      multi.saveAll().should('be.disabled');

      multi.resourceGraph().node('configmap', `${ namespace }/${ prefix }-config`).select();
      multi.editYaml((yaml) => yaml.replace('key: value', 'key: edited'));

      multi.saveAll().should('be.enabled');
    });

    it('saves every edited resource, the dependencies before the primary resource and the dependents after it', () => {
      const prefix = createSavingFixtures('save-order');
      const multi = openEditor('apps.deployment', `${ prefix }-app`).multiResourceYaml();
      const graph = multi.resourceGraph();
      const saved: string[] = [];

      cy.intercept('PUT', `**/v1/*/${ namespace }/${ prefix }-*`, (req) => {
        saved.push(new URL(req.url).pathname.split('/')[2]);
      }).as('save');

      // edited in the reverse of the order they are saved in
      graph.node('service', `${ namespace }/${ prefix }-app`).select();
      multi.editYaml((yaml) => yaml.replace(/\n(\s+)port: 80\n/, '\n$1port: 8080\n'));
      graph.node('apps.deployment', `${ namespace }/${ prefix }-app`).select();
      // the first `replicas` at this indent is the one in `spec`, which comes before `status`
      multi.editYaml((yaml) => yaml.replace('\n  replicas: 1\n', '\n  replicas: 2\n'));
      graph.node('configmap', `${ namespace }/${ prefix }-config`).select();
      multi.editYaml((yaml) => yaml.replace('key: value', 'key: edited'));

      multi.saveAll().click();
      cy.wait(['@save', '@save', '@save']);

      cy.wrap(saved).should('deep.equal', ['configmaps', 'apps.deployments', 'services']);
    });

    it('leaves the editor once every resource is saved', () => {
      const prefix = createSavingFixtures('save-all-leave');
      const listPage = new WorkloadsDeploymentsListPagePo(cluster);
      const multi = openEditor('apps.deployment', `${ prefix }-app`).multiResourceYaml();

      multi.resourceGraph().node('configmap', `${ namespace }/${ prefix }-config`).select();
      multi.editYaml((yaml) => yaml.replace('key: value', 'key: edited'));
      multi.saveAll().click();

      // not `waitForPage`: the list path is a prefix of the editor's path, so it matches before the editor leaves
      listPage.waitForPageWithExactUrl();
      cy.getRancherResource('v1', 'configmaps', `${ namespace }/${ prefix }-config`).its('body.data.key').should('eq', 'edited');
    });

    it('stays in the editor, keeping the edits not yet saved, when a save fails', () => {
      const prefix = createSavingFixtures('save-fails');
      const page = editPage('apps.deployment', `${ prefix }-app`);
      const multi = openEditor('apps.deployment', `${ prefix }-app`).multiResourceYaml();
      const graph = multi.resourceGraph();

      // the ConfigMap is a dependency, so it is saved before the Deployment, whose renamed save fails
      graph.node('configmap', `${ namespace }/${ prefix }-config`).select();
      multi.editYaml((yaml) => yaml.replace('key: value', 'key: edited'));
      graph.node('apps.deployment', `${ namespace }/${ prefix }-app`).select();
      multi.editYaml((yaml) => yaml.replace(`\n  name: ${ prefix }-app\n`, '\n  name: save-fails-renamed\n'));
      multi.saveAll().click();

      page.errorBanner().banner().should('be.visible');
      page.waitForPage();
      graph.node('configmap', `${ namespace }/${ prefix }-config`).checkModified(false);
      graph.node('apps.deployment', `${ namespace }/${ prefix }-app`).checkModified();
    });

    it('saves a resource that was changed in the background since it was opened, when the change and the edit touch different fields', () => {
      const prefix = createSavingFixtures('background');
      const listPage = new ConfigMapListPagePo(cluster);
      const multi = openEditor('configmap', `${ prefix }-config`).multiResourceYaml();

      multi.editYaml((yaml) => yaml.replace('key: value', 'key: edited'));
      changeConfigMapInBackground(`${ prefix }-config`, (configMap) => {
        configMap.metadata.labels = { ...configMap.metadata.labels, background: 'change' };
      });

      multi.saveAll().click();

      listPage.waitForPageWithExactUrl();
      cy.getRancherResource('v1', 'configmaps', `${ namespace }/${ prefix }-config`).then((resp: any) => {
        expect(resp.body.data.key).to.eq('edited');
        expect(resp.body.metadata.labels.background).to.eq('change');
      });
    });

    it('shows an error when the background change and the edit touch the same field', () => {
      const prefix = createSavingFixtures('conflict');
      const page = editPage('configmap', `${ prefix }-config`);
      const multi = openEditor('configmap', `${ prefix }-config`).multiResourceYaml();

      multi.editYaml((yaml) => yaml.replace('key: value', 'key: edited'));
      changeConfigMapInBackground(`${ prefix }-config`, (configMap) => {
        configMap.data.key = 'changed in the background';
      });

      multi.saveAll().click();

      page.errorBanner().banner().should('contain', 'data.key');
      page.waitForPage();
      cy.getRancherResource('v1', 'configmaps', `${ namespace }/${ prefix }-config`).its('body.data.key').should('eq', 'changed in the background');
    });
  });

  describe('cancel', () => {
    it('leaves the editor without saving', () => {
      const prefix = createSavingFixtures('cancel');
      const listPage = new WorkloadsDeploymentsListPagePo(cluster);
      const multi = openEditor('apps.deployment', `${ prefix }-app`).multiResourceYaml();

      multi.resourceGraph().node('configmap', `${ namespace }/${ prefix }-config`).select();
      multi.editYaml((yaml) => yaml.replace('key: value', 'key: edited'));
      multi.cancel().click();

      listPage.waitForPageWithExactUrl();
      cy.getRancherResource('v1', 'configmaps', `${ namespace }/${ prefix }-config`).its('body.data.key').should('eq', 'value');
    });

    it('waits for a running save to finish before leaving the editor', () => {
      const prefix = createSavingFixtures('cancel-running');
      const listPage = new WorkloadsDeploymentsListPagePo(cluster);
      const page = editPage('apps.deployment', `${ prefix }-app`);
      const multi = openEditor('apps.deployment', `${ prefix }-app`).multiResourceYaml();
      const config = multi.resourceGraph().node('configmap', `${ namespace }/${ prefix }-config`);

      cy.intercept('PUT', `**/v1/configmaps/${ namespace }/${ prefix }-config*`, (req) => {
        req.on('response', (res) => {
          res.setDelay(3000);
        });
      }).as('slowSave');

      config.select();
      multi.editYaml((yaml) => yaml.replace('key: value', 'key: edited'));
      config.save();
      multi.cancel().click();

      page.waitForPage();
      cy.wait('@slowSave').its('response.statusCode').should('eq', 200);
      listPage.waitForPageWithExactUrl();
      cy.getRancherResource('v1', 'configmaps', `${ namespace }/${ prefix }-config`).its('body.data.key').should('eq', 'edited');
    });
  });

  describe('provisioning clusters', () => {
    // creating an RKE2 cluster with machine pools provisions machines, which the e2e environment does not support
    it('shows the machine configs of an RKE2 cluster');
    it('writes a change to a machine config saved in the editor into the machine pool of the cluster');

    it('shows the cluster api, management and fleet clusters read-only in the referenced section', () => {
      const page = new ResourceYamlEditPagePo('provisioning.cattle.io.cluster', 'fleet-local/local', { clusterId: '_', product: 'manager' });
      const graph = page.multiResourceYaml().resourceGraph();
      const referenced = graph.referencedSection();

      page.goTo();
      page.waitForPage();
      referenced.toggle();

      graph.node('management.cattle.io.cluster', 'local').checkReadOnly();
      referenced.groupLabels().should('contain', 'Management Cluster');
    });
  });
});
