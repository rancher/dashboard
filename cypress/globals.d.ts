import { Verbs } from '@shell/types/api';
import { UserPreferences } from '@shell/types/userPreferences';

type Matcher = '$' | '^' | '~' | '*' | '';

export type CreateUserParams = {
  username: string,
  globalRole?: {
    role: string,
  },
  clusterRole?: {
    clusterId: string,
    role: string,
  },
  projectRole?: {
    clusterId: string,
    projectName: string,
    role: string,
  },
  password?: string,
}

export type CreateAmazonRke2ClusterParams = {
  machineConfig: {
    instanceType: string,
    region: string,
    vpcId: string,
    zone: string,
    type: string,
    clusterName: string,
    namespace: string
  },
  cloudCredentialsAmazon: {
    workspace: string,
    name: string,
    region: string,
    accessKey: string,
    secretKey: string
  },
  rke2ClusterAmazon: {
    clusterName: string,
    namespace: string,
  },
  metadata?: {
    labels?: { [key: string]: string },
    annotations?: { [key: string]: string },
  },
}
export type CreateAmazonRke2ClusterWithoutMachineConfigParams = {
  cloudCredentialsAmazon: {
    workspace: string,
    name: string,
    region: string,
    accessKey: string,
    secretKey: string
  },
  rke2ClusterAmazon: {
    clusterName: string,
    namespace: string,
  }
}

export interface CreateResourceNameOptions {
  onlyContext?: boolean
  prefixContext?: boolean
}

declare global {
  // eslint-disable-next-line no-unused-vars
  namespace Cypress {
    interface Chainable {
      setupWebSocket: any;

      state(state: any): any;

      login(username?: string, password?: string, cacheSession?: boolean, skipNavigation?: boolean): Chainable<Element>;
      logout(): Chainable;
      byLabel(label: string): Chainable<Element>;
      getRootE2EResourceName(): Chainable<string>;
      createE2EResourceName(context: string, options?: CreateResourceNameOptions): Chainable<string>;

      createUser(params: CreateUserParams, options?: { createNameOptions?: CreateResourceNameOptions }): Chainable;
      setGlobalRoleBinding(userId: string, role: string): Chainable;
      setClusterRoleBinding(clusterId: string, userPrincipalId: string, role: string): Chainable;
      setProjectRoleBinding(clusterId: string, userPrincipalId: string, projectName: string, role: string): Chainable;
      getProjectByName(clusterId: string, projectName: string): Chainable;
      createProject(projName: string, clusterId: string, userId: string): Chainable;
      createNamespaceInProject(nsName: string, projId: string): Chainable;
      createNamespace(nsName: string): Chainable;
      createPod(nsName: string, podName: string, image: string, failOnStatusCode?: boolean, options?: { createNameOptions?: CreateResourceNameOptions }): Chainable;
      createToken(description: string, ttl: number, failOnStatusCode?: boolean, clusterId?: string): Chainable;
      createGlobalRole(name: string, apiGroups: string[], resourceNames: string[], resources: string[], verbs: string[], newUserDefault: boolean, failOnStatusCode?: boolean, options?: { createNameOptions?: CreateResourceNameOptions }): Chainable;
      createFleetWorkspace(name: string, description?: string, failOnStatusCode?: boolean, options?: { createNameOptions?: CreateResourceNameOptions }): Chainable;
      createAwsCloudCredentials(nsName: string, cloudCredName: string, defaultRegion: string, accessKey: string, secretKey: string): Chainable;
      createAmazonMachineConfig(instanceType: string, region: string, vpcId: string, zone: string, type: string, clusterName: string, namespace: string): Chainable;
      createAmazonRke2Cluster(params: CreateAmazonRke2ClusterParams): Chainable;
      createAmazonRke2ClusterWithoutMachineConfig(params: CreateAmazonRke2ClusterWithoutMachineConfigParams): Chainable;

      getRancherResource(prefix: 'v3' | 'v1', resourceType: string, resourceId?: string, expectedStatusCode?: number): Chainable;
      setRancherResource(prefix: 'v3' | 'v1', resourceType: string, resourceId: string, body: any): Chainable;
      createRancherResource(prefix: 'v3' | 'v1', resourceType: string, body: any, failOnStatusCode?: boolean): Chainable;
      waitForRancherResource(prefix: 'v3' | 'v1', resourceType: string, resourceId: string, testFn: (resp: any) => boolean, retries?: number): Chainable;
      waitForRancherResources(prefix: 'v3' | 'v1', resourceType: string, expectedResourcesTotal: number, greaterThan: boolean): Chainable;
      deleteRancherResource(prefix: 'v3' | 'v1' | 'k8s', resourceType: string, resourceId: string, failOnStatusCode?: boolean): Chainable;
      deleteNodeTemplate(nodeTemplateId: string, timeout?: number, failOnStatusCode?: boolean)

      tableRowsPerPageAndNamespaceFilter(rows: number, clusterName: string, groupBy: string, namespaceFilter: string)
      tableRowsPerPageAndPreferences(rows: number, preferences: { clusterName: string, groupBy: string, namespaceFilter: string, allNamespaces: string}, iteration?: number)

      setUserPreference(prefs: any);

      /**
       * update namespace filter
       * @param clusterName
       * @param groupBy to update list view to 'flat list', 'group by namespaces', or 'group by node' ('none', 'metadata.namespace', or 'role')
       * @param namespaceFilter to filter by 'only user namespaces', 'all namespace', etc. ('{"local":["all://user"]}', '{\"local\":[]}', etc.)
       */
      updateNamespaceFilter(clusterName: string, groupBy:string, namespaceFilter: string, iteration?: number): Chainable;

      /**
       *  Wrapper for cy.get() to simply define the data-testid value that allows you to pass a matcher to find the element.
       * @param id Value used for the data-testid attribute of the element.
       * @param matcher Matching character used for attribute value:
       * - `$`: Suffixed with this value
       * - `^`: Prefixed with this value
       * - `~`: Contains this value as whitespace separated words
       * - `*`: Contains this value
       */
      getId(id: string, matcher?: Matcher): Chainable<Element>;

      /**
       *  Wrapper for cy.find() to simply define the data-testid value that allows you to pass a matcher to find the element.
       * @param id Value used for the data-testid attribute of the element.
       * @param matcher Matching character used for attribute value:
       * - `$`: Suffixed with this value
       * - `^`: Prefixed with this value
       * - `~`: Contains this value as whitespace separated words
       * - `*`: Contains this value
       */
      findId(id: string, matcher?: Matcher): Chainable<Element>;

      /**
       * Override user preferences to default values, allowing to pass custom preferences for a deterministic scenario
       * Leave empty for reset to default values
       */
      // eslint-disable-next-line no-undef
      userPreferences(preferences?: Partial<UserPreferences>): Chainable<null>;

      requestBase64Image(url: string): Chainable;

      keyboardControls(triggerKeys: Partial<any>, count: number): Chainable<Element>;

      interceptAllRequests(verbs: Verbs, urls: string[], timeout: number): Chainable<string>;

      iFrame(): Chainable<Element>;

      // Check if an element is visible to the user on the screen.
      isVisible(): Chainable<Element>;

      // Check if an element is disabled
      isDisabled(): Chainable<Element>;

      // Check if an element is disabled
      isEnabled(): Chainable<Element>;

      // Check css var
      shouldHaveCssVar(name: string, value: string);

      /**
       * Fetch the steve `revision` / timestamp of request
       */
      fetchRevision(): Chainable<string>;

      /**
       * Check if the vai FF is enabled
       */
      isVaiCacheEnabled(): Chainable<boolean>;

      /**
       * Run an accessibility check on the current page or the specified element
       */
      checkPageAccessibility(description?: string);

      /**
       * Run an accessibility check on the specified element
       */
      checkElementAccessibility(selector: any, description?: string);
    }
  }
}
