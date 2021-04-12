<script>
import { mapPref, THEME } from '@/store/prefs';
import { ucFirst } from '@/utils/string';

export default {
  layout: 'unauthenticated',

  data() {
    return {
      mode:    'edit',
      tooltip: '',
      a:       'a',
      b:       'b',
      c:       'c',
      d:       42,
      e:       'e',
      f:       'f',
      g:       'g',
      h:       'h',
      i:       'i',
      n:       'n',
      m:       'm',
      x:       'x',
      cb:      false,
    };
  },

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
        <img class="" src="~/assets/images/providers/aliyunecs.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/amazonec2.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/amazoneks.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/azureaks.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/digitalocean.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/equinix.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/googlegke.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/k3s.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/kubernetes.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/linodelke.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/minikube.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/open-telekom-cloud.svg" />
      </div>
    </div>
    <div class="row">
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/oracleoke.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/packet.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/rackspace.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/tencenttke.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/vmwarevsphere.svg" />
      </div>
    </div>

    <!--black logos-->
    <h2>Single Color Logos</h2>
    <div class="row">
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/aliyunecs-black.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/amazonec2-black.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/amazoneks-black.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/azureaks-black.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/digitalocean-black.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/equinix-black.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/googlegke-black.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/k3s-black.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/kubernetes-black.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/linodelke-black.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/minikube-black.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/open-telekom-cloud-black.svg" />
      </div>
    </div>
    <div class="row">
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/oracleoke-black.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/packet-black.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/rackspace-black.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/tencenttke-black.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/vmwarevsphere-black.svg" />
      </div>
    </div>
    <div class="reverse-filter">
      <h2>Inverted with CSS - Single Color Logos</h2>
      <div class="row">
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/aliyunecs-black.svg" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/amazonec2-black.svg" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/amazoneks-black.svg" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/azureaks-black.svg" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/digitalocean-black.svg" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/equinix-black.svg" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/googlegke-black.svg" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/k3s-black.svg" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/kubernetes-black.svg" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/linodelke-black.svg" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/minikube-black.svg" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/open-telekom-cloud-black.svg" />
        </div>
      </div>
      <div class="row">
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/oracleoke-black.svg" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/packet-black.svg" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/rackspace-black.svg" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/tencenttke-black.svg" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/vmwarevsphere-black.svg" />
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
