function executeWebSocket(command: string, podName: string, namespace: string, containerName: string, bearerToken:string) {
  const websocketUrl = Cypress.env('api').replace('https', 'wss');

  return cy.setupWebSocket(
    websocketUrl,
    namespace,
    podName,
    containerName,
    command,
    bearerToken
  );
}

describe('Pod management and WebSocket interaction', { tags: ['@jenkins', '@adminUser'] }, () => {
  let token:string;
  const tokenDesc = 'e2e-test-description';
  let tokenId:string;

  before(() => {
    cy.login();
    // create tokens
    cy.createToken(tokenDesc, 3600000, false).then((resp: Cypress.Response<any>) => {
      token = resp?.body?.token;
      tokenId = resp?.body?.id;
    });
  });
  let podId = '';
  let podName = `e2e-test`;
  const projName = `project${ +new Date() }`;
  const nsName = `namespace${ +new Date() }`;

  it('should create a new pod', () => {
    // get user id
    cy.getRancherResource('v3', 'users?me=true').then((resp: Cypress.Response<any>) => {
      const userId = resp.body.data[0].id.trim();

      // create project
      cy.createProject(projName, 'local', userId).then((resp: Cypress.Response<any>) => {
        cy.wrap(resp.body.id.trim()).as('projId');

        // create ns
        cy.get<string>('@projId').then((projId) => {
          cy.createNamespaceInProject(nsName, projId);
        });

        // create pod
        cy.createPod(nsName, podName, 'nginx:stable-alpine3.20-perl').then((resp) => {
          podName = resp.body.metadata.name;
          podId = resp.body.metadata.id;
        });

        // Wait until pod state is running
        cy.waitForRancherResource('v1', 'pods', podId, (resp) => {
          const podObject = resp.body.data.find((obj: { id: string; }) => obj.id === `${ nsName }/${ podName }`);

          return podObject ? podObject.status.phase === 'Running' : false;
        }, 10).then((result) => {
          // eslint-disable-next-line no-unused-expressions
          expect(result).to.be.true;
        });
      });
    });
  });

  it('should create a new folder', () => {
    executeWebSocket('mkdir test-directory && echo "Directory created successfully"', podName, nsName, 'container-0', token).then((messages: any[]) => {
      expect(messages[2]).not.to.equal(undefined);
      expect(messages[2]).to.include('Directory created successfully');
    });
  });

  it('should validate the folder name', () => {
    executeWebSocket('ls', podName, nsName, 'container-0', token).then((messages: any[]) => {
      expect(messages[2]).not.to.equal(undefined);
      expect(messages[2]).to.include('test-directory');
    });
  });

  it('should delete the folder', () => {
    executeWebSocket('rm -rf test-directory && echo "Directory deleted successfully"', podName, nsName, 'container-0', token).then((messages: any[]) => {
      expect(messages[2]).not.to.equal(undefined);
      expect(messages[2]).to.include('Directory deleted successfully');
    });
  });
  after(() => {
    // restoring session
    cy.login();
    // delete token
    cy.deleteRancherResource('v3', 'tokens', tokenId, false);
  });
});
