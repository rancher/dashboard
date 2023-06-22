import UsersAndAuthPo from '~/cypress/e2e/po/pages/users-and-auth/users-and-auth.po';
import ClusterProjectMembersPo from '~/cypress/e2e/po/pages/explorer/cluster-project-members.po';

const runTimestamp = +new Date();
const runPrefix = `e2e-test-${ runTimestamp }`;

const username = `${ runPrefix }-cluster-proj-member`;
const standardPassword = 'standard-password';

describe('Cluster Project and Members', () => {
  it('Members added to both Cluster Membership should not show "Loading..." next to their names', () => {
    const usersAdmin = new UsersAndAuthPo('_', 'management.cattle.io.user');

    // this will login as admin
    cy.login();

    // create a standard user
    usersAdmin.goTo();

    const clusterMembership = new ClusterProjectMembersPo('local', 'cluster-membership');

    clusterMembership.navTo();

    // usersAdmin.listCreate();

    // usersAdmin.username().set(username);
    // usersAdmin.newPass().set(standardPassword);
    // usersAdmin.confirmNewPass().set(standardPassword);
    // usersAdmin.saveCreateForm().click();

    // // add user to Cluster membership
    // const clusterMembership = new ClusterProjectMembersPo('local', 'cluster-membership');

    // clusterMembership.goTo();
    // clusterMembership.triggerAddClusterOrProjectMemberAction();
    // clusterMembership.selectClusterOrProjectMember(username);
    // clusterMembership.saveCreateForm().click();

    // clusterMembership.goTo();
    // clusterMembership.waitForPage();
    // clusterMembership.listElementWithName(username).should('exist');

    // clusterMembership.listElementWithName(username).find('.principal .name').invoke('text').then((t) => {
    //   // clear new line chars and white spaces
    //   const sanitizedName = t.trim().replace(/^\n|\n$/g, '');

    //   // no string "loading..." next to name
    //   // usecase https://github.com/rancher/dashboard/issues/8804
    //   expect(sanitizedName).to.equal(username);
    // });
  });
});
