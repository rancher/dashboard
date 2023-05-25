# Quickstart

## Running for Development

To get started running the UI for development:

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

## Other Building Modes

> This documentation is out of date

```bash
# Build for standalone use within Rancher
# (These are done on commit/tag via Drone)
./scripts/build-embedded # for embedding into rancher builds
./scripts/build-hosted # for hosting on a static file webserver and pointing Rancher's ui-dashboard-index at it
# Output in dist/

# Build and run with server-side-rendering
# (This method and SSR are not currently used, but should be maintained for future)
yarn build
yarn start

# Develop via Docker instead of a local nodejs
docker build -f Dockerfile.dev -t dashboard:dev .
docker run -v $(pwd):/src \
  -v dashboard_node:/src/node_modules \
  -p 8005:8005 \
  -e API=https://your-rancher \
  dashboard:dev
# The first time will take *forever* installing node_modules into the volume; it will be faster next time.
# Goto https://localhost:8005

# Developing against a standalone "Steve" API on a Mac
git clone https://github.com/rancher/steve.git
cd steve
make run-host

cd dashboard
docker build -f Dockerfile.dev -t rancher/dashboard:dev .
docker run -v $(pwd):/src \
  -v dashboard_node:/src/node_modules \
  -p 8005:8005 \
  -e API=http://172.17.0.1:8989 \
  rancher/dashboard:dev
# The first time will take *forever* installing node_modules into the volume; it will be faster next time.
# Goto https://localhost:8005
```
