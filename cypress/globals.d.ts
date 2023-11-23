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
  }
}

// eslint-disable-next-line no-unused-vars
declare namespace Cypress {
  interface Chainable {

    state(state: any): any;

    login(username?: string, password?: string, cacheSession?: boolean): Chainable<Element>;
    logout(): Chainable;
    byLabel(label: string): Chainable<Element>;

    createUser(params: CreateUserParams): Chainable;
    setGlobalRoleBinding(userId: string, role: string): Chainable;
    setClusterRoleBinding(clusterId: string, userPrincipalId: string, role: string): Chainable;
    setProjectRoleBinding(clusterId: string, userPrincipalId: string, projectName: string, role: string): Chainable;
    getProjectByName(clusterId: string, projectName: string): Chainable;
    createProject(projName: string, clusterId: string, userId: string): Chainable;
    createNamespace(nsName: string, projId: string): Chainable;

    getRancherResource(prefix: 'v3' | 'v1', resourceType: string, resourceId?: string, expectedStatusCode: string): Chainable;
    setRancherResource(prefix: 'v3' | 'v1', resourceType: string, resourceId: string, body: string): Chainable;
    deleteRancherResource(prefix: 'v3' | 'v1', resourceType: string, resourceId: string): Chainable;

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
  }
}
