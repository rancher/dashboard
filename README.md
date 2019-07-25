# dashboard

> Rancher Dashboard

## Build Setup

``` bash
# install dependencies
$ yarn install

# serve with hot reload at https://localhost:8005
$ API=tempe.rancherlabs.com API_TOKEN=... API_PREFIX=/k8s/clusters/local API_URL=https://localhost:8005/k8s/clusters/local yarn dev

# build for production and launch server
$ yarn build
$ yarn start

# generate static project
$ yarn generate
```

For detailed explanation on how things work, checkout [Nuxt.js docs](https://nuxtjs.org).
