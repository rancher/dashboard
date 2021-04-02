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
        <img class="" src="~/assets/images/providers/provider-aliyunecs.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-amazonec2.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-amazoneks.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-azureaks.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-digitalocean.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-equinix.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-googlegke.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-k3s.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-kubernetes.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-linodelke.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-minikube.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-open-telekom-cloud.svg" />
      </div>
    </div>
    <div class="row">
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-oracleoke.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-packet.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-rackspace.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-tencenttke.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-vmwarevsphere.svg" />
      </div>
    </div>

    <!--black logos-->
    <h2>Single Color Logos</h2>
    <div class="row">
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-aliyunecs-black.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-amazonec2-black.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-amazoneks-black.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-azureaks-black.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-digitalocean-black.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-equinix-black.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-googlegke-black.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-k3s-black.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-kubernetes-black.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-linodelke-black.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-minikube-black.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-open-telekom-cloud-black.svg" />
      </div>
    </div>
    <div class="row">
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-oracleoke-black.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-packet-black.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-rackspace-black.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-tencenttke-black.svg" />
      </div>
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-vmwarevsphere-black.svg" />
      </div>
    </div>
    <div class="reverse-filter">
      <h2>Inverted with CSS - Single Color Logos</h2>
      <div class="row">
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/provider-aliyunecs-black.svg" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/provider-amazonec2-black.svg" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/provider-amazoneks-black.svg" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/provider-azureaks-black.svg" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/provider-digitalocean-black.svg" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/provider-equinix-black.svg" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/provider-googlegke-black.svg" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/provider-k3s-black.svg" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/provider-kubernetes-black.svg" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/provider-linodelke-black.svg" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/provider-minikube-black.svg" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/provider-open-telekom-cloud-black.svg" />
        </div>
      </div>
      <div class="row">
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/provider-oracleoke-black.svg" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/provider-packet-black.svg" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/provider-rackspace-black.svg" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/provider-tencenttke-black.svg" />
        </div>
        <div class="col span-1">
          <img class="" src="~/assets/images/providers/provider-vmwarevsphere-black.svg" />
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
