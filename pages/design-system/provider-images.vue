<script>
import { mapPref, THEME } from '@/store/prefs';
import { ucFirst } from '@/utils/string';

export default {
  layout: 'unauthenticated',

  computed: {
    theme: mapPref(THEME),

    themeOptions() {
      return this.$store.getters['prefs/options'](THEME).map((value) => {
        return {
          label: ucFirst(value),
          value
        };
      });
    },
  }
};
</script>
<template>
  <div>
    <!--these images are 100px X 100px svgs setting the image to fit the frame-->
    <h2>Full Color Logos</h2>
    <div class="row">
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/aliyunecs.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/amazonec2.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/amazoneks.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/azureaks.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/digitalocean.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/equinix.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/googlegke.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/k3s.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/kubernetes.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/linodelke.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/minikube.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/otc.svg" alt="altText" />
      </div>
    </div>
    <div class="row">
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/oracleoke.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/packet.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/rackspace.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/tencenttke.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/vmwarevsphere.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/aliyun.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/baidu.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/cloudca.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/cloudscale.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/huaweicce.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/oci.svg" alt="altText" />
      </div>
    </div>

    <div class="row">
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/openstack.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/otc.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/pinganyunecs.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/pnap.svg" alt="altText" />
      </div>
    </div>

    <!--black logos-->
    <h2>Single Color Logos</h2>
    <div class="row">
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/aliyunecs-black.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/amazonec2-black.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/amazoneks-black.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/azureaks-black.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/digitalocean-black.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/equinix-black.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/googlegke-black.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/k3s-black.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/kubernetes-black.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/linodelke-black.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/minikube-black.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/otc-black.svg" alt="altText" />
      </div>
    </div>
    <div class="row">
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/oracleoke-black.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/packet-black.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/rackspace-black.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/tencenttke-black.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/vmwarevsphere-black.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/aliyun-black.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/baidu-black.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/cloudca-black.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/cloudscale-black.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/huaweicce-black.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/oci-black.svg" alt="altText" />
      </div>
    </div>

    <div class="row">
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/openstack-black.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/otc-black.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/pinganyunecs-black.svg" alt="altText" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/pnap-black.svg" alt="altText" />
      </div>
    </div>

    <div class="reverse-filter">
      <h2>Inverted with CSS - Single Color Logos</h2>
      <div class="row">
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/aliyunecs-black.svg" alt="altText" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/amazonec2-black.svg" alt="altText" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/amazoneks-black.svg" alt="altText" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/azureaks-black.svg" alt="altText" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/digitalocean-black.svg" alt="altText" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/equinix-black.svg" alt="altText" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/googlegke-black.svg" alt="altText" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/k3s-black.svg" alt="altText" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/kubernetes-black.svg" alt="altText" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/linodelke-black.svg" alt="altText" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/minikube-black.svg" alt="altText" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/otc-black.svg" alt="altText" />
        </div>
      </div>
      <div class="row">
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/oracleoke-black.svg" alt="altText" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/packet-black.svg" alt="altText" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/rackspace-black.svg" alt="altText" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/tencenttke-black.svg" alt="altText" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/vmwarevsphere-black.svg" alt="altText" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang='scss' scoped>
.row {
  align-items: center;
  border-bottom: solid thin #d7d7d7;
  margin: .75% auto;
}

.col {
  border-right: solid thin #d7d7d7;
  margin: 0;
  padding: .75%;
}

.reverse-filter {
  background: black;

  .row {
    border-color: #3d3d3d;
  }

  .col {
    border-color: #3d3d3d;
  }

  .col img {
    filter: invert(100%);
  }
}
</style>
