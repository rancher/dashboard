/**
 * NODE POOLS
 * initialNodeCount >=1
 * minNodeCount >= 0
 * maxNodeCount >=1
 * diskSizeGb >=10
 * ssdCount >=0
 * name required
 * name must be unique within the cluster
 *
 *
 *
 * CONFIG
 * on edit, logging and monitoring both need to be enabled or both disabled
 * if enablePrivateNodes is true, masterIpv4CidrBlock is required
 * if useIpAliases is NOT true, subnetwork is required
 * if local type is zonal region should be null; if location type is regional zone should be null
 *
 */
