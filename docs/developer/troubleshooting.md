# Troubleshooting

> &#x26a0;&#xfe0f; Documentation in this directory is intended for internal use only. Any information contained here is unsupported.

## yarn dev

### Hot reload doesn't connect through a proxy

**Symptom:** the dev server is opened through a proxy on another port. The page loads, but changes don't hot reload and the browser console shows the hot reload websocket failing to connect to the proxy's port (`wss://<host>:<proxy port>/ws`).

**Cause:** the hot reload client connects to the port the page was loaded from, and the proxy doesn't forward websockets to the dev server.

**Fix:** set `DEV_WS_PORT` to the dev server's port so the client connects to it directly, e.g.

```
DEV_WS_PORT=8005 API=<rancher> yarn dev
```
