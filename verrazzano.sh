#!/bin/sh
#
# Added by Verrazzano
#
# This script is used to install Rancher Dashboard customizations
# where the customization does not require changing the application source code.
#
if [ ! -z "${KUBECONFIG}" ]; then
  export KUBECONFIG
fi

label_patch="{ \"op\": \"replace\", \"path\": \"/value\", \"value\": \"Verrazzano\" }"
kubectl patch Setting ui-pl -n cattle-impersonation-system --type json -p "[${label_patch}]"

logo_dir="$(dirname "$0")"/pkg/verrazzano/assets/images

logo_base64=$(cat $logo_dir/verrazzano-light.svg | base64)
kubectl apply -f - <<EOF
apiVersion: management.cattle.io/v3
kind: Setting
metadata:
    name: ui-logo-light
value: "data:image/svg+xml;base64,${logo_base64}"
EOF

logo_base64=$(cat $logo_dir/verrazzano-dark.svg | base64)
kubectl apply -f - <<EOF
apiVersion: management.cattle.io/v3
kind: Setting
metadata:
    name: ui-logo-dark
value: "data:image/svg+xml;base64,${logo_base64}"
EOF

kubectl apply -f - <<EOF
apiVersion: management.cattle.io/v3
kind: Setting
metadata:
    name: ui-brand
value: "verrazzano"
EOF
