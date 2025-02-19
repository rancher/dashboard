import * as https from 'https';
import * as ws from 'ws';

function b64decode(s: any): string {
  return Buffer.from(s.slice(1).toString('utf-8'), 'base64').toString('utf-8');
}

function buildPodExecUrl(baseUrl: string, namespace: string, podName: string, containerName: string, commands: any[]): string {
  const urlBase = `${ baseUrl }/api/v1/namespaces/${ namespace }/pods/${ podName }/exec`;
  const params = new URLSearchParams({
    container: containerName,
    stdout:    '1',
    stdin:     '1',
    stderr:    '1',
    tty:       '1',
  });

  commands.forEach((command: any) => {
    params.append('command', command);
  });

  return `${ urlBase }?${ params.toString() }`;
}

export default function websocketTasks(on: any, config: any) {
  on('task', {
    setupWebSocket(options: any) {
      return new Promise((resolve, reject) => {
        const {
          CATTLE_TEST_URL,
          NAMESPACE,
          POD_NAME,
          CONTAINER_NAME,
          commandSend,
          BEARER_TOKEN,
        } = options;

        const commands = ['/bin/sh', '-c', `${ commandSend }`];
        const url = buildPodExecUrl(CATTLE_TEST_URL, NAMESPACE, POD_NAME, CONTAINER_NAME, commands);

        const agent = new https.Agent({ rejectUnauthorized: false });
        const wsClient = new ws.WebSocket(url, 'base64.channel.k8s.io', {
          headers: {
            Authorization: `Bearer ${ BEARER_TOKEN }`,
            Origin:        CATTLE_TEST_URL,
            'User-Agent':  'Mozilla/5.0',
            Connection:    'Upgrade',
            Upgrade:       'websocket',
          },
          agent,
          perMessageDeflate: false,
        });

        const messages: any[] = [];

        wsClient.on('open', () => {
          wsClient.send(`${ commandSend }`);
        });

        wsClient.on('message', (data: any) => {
          const decoded = b64decode(data);

          messages.push(decoded);
        });

        wsClient.on('close', () => {
          resolve(messages);
        });

        wsClient.on('error', (error: any) => {
          reject(new Error(`WebSocket error: ${ error.message }`));
        });
      });
    },
  });
}
