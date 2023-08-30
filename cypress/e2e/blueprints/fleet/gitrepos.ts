export const gitRepoCreateRequest = {
    "type": "fleet.cattle.io.gitrepo",
    "metadata": {
        "namespace": "fleet-local",
        "name": "fleet-e2e-test-gitrepo"
    },
    "spec": {
        "repo": "https://github.com/Shavindra/fleet-examples.git",
        "branch": "dashboard-e2e-basic",
        "paths": [],
        "correctDrift": {
            "enabled": false
        },
        "targets": [
            {
                "clusterSelector": {
                    "matchExpressions": [
                        {
                            "key": "provider.cattle.io",
                            "operator": "NotIn",
                            "values": [
                                "harvester"
                            ]
                        }
                    ]
                }
            }
        ],
        "insecureSkipTLSVerify": false,
        "helmRepoURLRegex": "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$",
        "helmSecretName": "auth-95j88"
    }
}