// Browser shim for node's 'https' module (aliased in shell/vite.config.ts).
// The dashboard only uses https.Agent, passed to axios as httpsAgent, which is
// ignored by axios in the browser (the webpack NodePolyfillPlugin shim was
// equally inert). Only the shape is provided.
export class Agent {
  constructor(options) {
    this.options = options;
  }
}

export default { Agent };
