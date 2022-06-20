## 1) Create a generic OS image with additional tooling (like cos-toolkit and e.g. xorriso for ISO creation)
`git clone https://github.com/rancher-sandbox/os2.git`
`cd os2`
`docker build -f Dockerfile .`

## 2) Create the required ISO/vm/cloud image with the embedded token
`git clone https://github.com/rancher-sandbox/rancher-node-image.git`
`cd rancher-node-image`
`./elemental-iso-build "--the-image-tag-you-built-in-step1--" "--format--" "--machine-reg-file--"`
Example: `./elemental-iso-build some-docker-image-name:some-tag iso ./some-machine-reg.yaml`