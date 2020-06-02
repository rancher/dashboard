export const TEMPLATE_NAME = 'rio';
export const APP_ID = 'rancher-rio';
export const CONFIG = `---
image: strongmonkey1992/rio-controller
tag: dev                # Rio version to install
letsEncryptEmail: ""    # Provide an email for Let's Encrypt account registration
ipAddress: ""           # Manually specify IP addresses to generate rdns domain, supports comma separated values
debug: false            # Enable debug logging in controller

# Manually specify features to disable, supports comma separated values
features:
  autoscaling: true
  build: true
  dashboard: false
  gloo: false
  linkerd: false
  istio: true
  ingress: false
  letsencrypt: true
  rdns: true

gatewayServiceName: istio-ingressgateway
gatewayServiceNamespace: istio-system
addRemoteAddressFilter: false
`;
