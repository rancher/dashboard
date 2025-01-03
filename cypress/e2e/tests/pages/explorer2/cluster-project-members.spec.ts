import UsersPo from '@/cypress/e2e/po/pages/users-and-auth/users.po';
import ClusterProjectMembersPo from '@/cypress/e2e/po/pages/explorer/cluster-project-members.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';

const runTimestamp = +new Date();
const runPrefix = `e2e-test-${ runTimestamp }`;

const username = `${ runPrefix }-cluster-proj-member`;
const standardPassword = 'standard-password';

describe('Cluster Project and Members', { tags: ['@explorer2', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });
  it('Members added to both Cluster Membership should not show "Loading..." next to their names', () => {
    const usersAdmin = new UsersPo('_');
    const userCreate = usersAdmin.createEdit();

    // create a standard user
    usersAdmin.goTo();
    usersAdmin.list().create();

    userCreate.username().set(username);
    userCreate.newPass().set(standardPassword);
    userCreate.confirmNewPass().set(standardPassword);
    userCreate.saveCreateWithErrorRetry();
    usersAdmin.waitForPageWithExactUrl();

    // add user to Cluster membership
    const clusterMembership = new ClusterProjectMembersPo('local', 'cluster-membership');

    clusterMembership.navToClusterMenuEntry('local');
    // if we do not wait for the cluster page to load, then we get the old side nav from Users & Authentication
    clusterMembership.waitForPageWithSpecificUrl('/c/local/explorer');
    clusterMembership.navToSideMenuEntryByLabel('Cluster and Project Members');
    clusterMembership.triggerAddClusterOrProjectMemberAction();
    clusterMembership.selectClusterOrProjectMember(username);
    cy.intercept('POST', '/v3/clusterroletemplatebindings').as('createClusterMembership');
    clusterMembership.saveCreateForm().click();
    cy.wait('@createClusterMembership');

    clusterMembership.waitForPageWithExactUrl();
    cy.get('body tbody').then((el) => {
      if (el.find('tr.no-rows').is(':visible')) {
        cy.reload();
      }
      clusterMembership.listElementWithName(username).should('exist');
      clusterMembership.listElementWithName(username).find('.principal .name').invoke('text').then((t) => {
      // clear new line chars and white spaces
        const sanitizedName = t.trim().replace(/^\n|\n$/g, '');

        // no string "loading..." next to name
        // usecase https://github.com/rancher/dashboard/issues/8804
        expect(sanitizedName).to.equal(username);
      });
    });
  });
  it('Clicking cancel should return to Cluster and Project members ', () => {
    HomePagePo.goTo();
    const clusterMembership = new ClusterProjectMembersPo('local', 'cluster-membership');

    clusterMembership.navToClusterMenuEntry('local');
    // if we do not wait for the cluster page to load, then we get the old side nav from Users & Authentication
    clusterMembership.waitForPageWithSpecificUrl('/c/local/explorer');
    clusterMembership.navToSideMenuEntryByLabel('Cluster and Project Members');
    clusterMembership.triggerAddClusterOrProjectMemberAction();
    clusterMembership.cancelCreateForm().click();
    clusterMembership.waitForPageWithExactUrl();
  });
});
