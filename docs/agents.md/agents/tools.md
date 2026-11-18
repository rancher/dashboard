## Tools

- **Install dependencies**: `yarn install --frozen-lockfile`
- **Start development server**: `API=<Rancher_Backend_URL> yarn dev`
  - The `API` environment variable should point to a running Rancher server (e.g., `https://localhost`).
  - The dashboard will be available at `https://127.0.0.1:8005`.
- **Build**: `yarn build`
- **Lint**: `yarn lint`
- **Lint one ore more files**: `./node_modules/.bin/eslint <file 1> <file 2>`
- **Unit Tests**: `yarn test:ci` (Jest)
- **E2E Tests**: See contributors guide