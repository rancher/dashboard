#!/bin/bash

# Still to do
# Persist project name to id map (in case of failure)
# Leave more gaps between creating projects (crashes my DO 2 out of 3 times)
# Convert YAML output to $RANCHER_API/v1/management.cattle.io.clusters/$CLUSTER_ID?action=apply request (needs multi line `\n`ing) 
# Clean up resources (would need to delete projects and their namespaces)

# Optional args
PROJECTS=300
NAMESPACES=1000
DEPLOYMENTS=3000

# Require args
# Note key must NOT be scoped
CATTLE_ACCESS_KEY=
CATTLE_SECRET_KEY=
CLUSTER_ID=
RANCHER_API=

while getopts p:n:d:a:s:c:r: option
do
 case "${option}"
 in
 p) PROJECTS=${OPTARG};;
 n) NAMESPACES=${OPTARG};;
 d) DEPLOYMENTS=${OPTARG};;
 a) CATTLE_ACCESS_KEY=${OPTARG};;
 s) CATTLE_SECRET_KEY=${OPTARG};;
 c) CLUSTER_ID=${OPTARG};;
 r) RANCHER_API=${OPTARG};;
 esac
done

declare -A PROJECT_MAP
PROJECT_MAP=( )
ns_without_project=$(( $NAMESPACES / 100)) # When over 100 namespaces, 1% will not be in a project
d_crashing=$(( $DEPLOYMENTS / 100)) # When over 100 deployments, 1% will continually crash
output_file_name="output.yaml"

echo "This script will"
echo "Create..."
echo "$PROJECTS Projects"
echo 
echo "Produce yaml for..." 
echo "$NAMESPACES Namespaces (with $ns_without_project not in a project)"
echo "$DEPLOYMENTS Deployments (with $d_crashing that constantly crash)"
echo "(apply the yaml in $output_file_name to create them)"
echo
echo



echo "Creating $PROJECTS Projects........"
PROJECT_REGEX='"id":"'${CLUSTER_ID}':(p-[a-z,0-9]+)"'
ps_counter=1
while [ $ps_counter -le $PROJECTS ]
do
    PROJECT_NAME=scaling-project-$ps_counter

    RESPONSE=$(curl -s -u "${CATTLE_ACCESS_KEY}:${CATTLE_SECRET_KEY}" \
-X POST \
-H 'Accept: application/json' \
-H 'Content-Type: application/json' \
--data "$(cat <<EOF
{
"clusterId": "$CLUSTER_ID",
"containerDefaultResourceLimit": null,
"enableProjectMonitoring": false,
"name": "$PROJECT_NAME",
"namespaceDefaultResourceQuota": null,
"namespaceId": "",
"resourceQuota": null
}
EOF
)" "$RANCHER_API/v3/projects")

    if [[ $RESPONSE =~ $PROJECT_REGEX ]]
    then
        PROJECT_ID="${BASH_REMATCH[1]}"
        PROJECT_MAP[$PROJECT_NAME]=$PROJECT_ID
        echo "Created Project '${PROJECT_NAME}' (${PROJECT_ID})"
    else
        echo "project id not found"
    fi

    ((ps_counter++))

done



echo "Creating YAML for $NAMESPACES Namespaces........"
ns_counter=1
while [ $ns_counter -le $NAMESPACES ]
do
    NS_NAME=scaling-ns-$ns_counter
    
    if [ "$ns_counter" -gt "$ns_without_project" ]; then
    PROJECT_NUMBER=$(shuf -i 1-$NAMESPACES -n 1)
    PROJECT_ID=${PROJECT_MAP[scaling-project-$PROJECT_NUMBER]}
    cat << EOF >> $output_file_name
---
apiVersion: v1
kind: Namespace
metadata:
  name: $NS_NAME
  annotations:
    field.cattle.io/projectId: "$CLUSTER_ID:$PROJECT_ID"
  labels:
    field.cattle.io/projectId: "$PROJECT_ID"
EOF
    else
        cat << EOF >> $output_file_name
---
apiVersion: v1
kind: Namespace
metadata:
  name: $NS_NAME
EOF
    fi
    
    ((ns_counter++))
done



echo "Creating YAML for $DEPLOYMENTS Deployments......."
d_counter=1
while [ $d_counter -le $DEPLOYMENTS ]
do
    NS_NAME=scaling-d-$d_counter
    
    NAMESPACE_NUMBER=$(shuf -i 1-$NAMESPACES -n 1)
    NAMESPACE=scaling-ns-$NAMESPACE_NUMBER

    if [ "$d_counter" -gt "$d_crashing" ]; then
      cat << EOF >> $output_file_name
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: $NS_NAME
  namespace: $NAMESPACE
spec:
  selector:
    matchLabels:
      app: $NS_NAME
  replicas: 1
  template:
    metadata:
      labels:
        app: $NS_NAME
    spec:     
      containers:
        - command:
            - bash
            - -c
            - "echo test; sleep 1000;"
          image: ubuntu
          name: test-container
EOF
    else
      cat << EOF >> $output_file_name
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: $NS_NAME
  namespace: $NAMESPACE
spec:
  selector:
    matchLabels:
      app: $NS_NAME
  replicas: 1
  template:
    metadata:
      labels:
        app: $NS_NAME
    spec:     
      containers:
        - command:
            - bash
            - -c
            - "echo test; sleep 10; exit 1;"
          image: ubuntu
          name: crashing-test-container
EOF
    fi
    
    ((d_counter++))
done
