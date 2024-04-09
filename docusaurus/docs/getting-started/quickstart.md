# Quickstart

## Running for Development

To get started running the UI for development:

Prerequisites:

* Node 16 (later versions are currently not supported)

* yarn:
  ```npm install --global yarn```

Run:

```bash
# Install dependencies
yarn install

# For development, serve with hot reload at https://localhost:8005
# using the endpoint for your Rancher API
API=https://your-rancher yarn dev
# or put the variable into a .env file
# Goto https://localhost:8005
```

> Note: `API` is the URL of a deployed Rancher environment (backend API)

