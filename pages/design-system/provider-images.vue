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
      <div class="col span-1">
        <img class="" src="~/assets/images/providers/provider-oracleoke.svg" />
      </div>
    </div>
    <div class="row">
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
  </div>
</template>

<style lang='scss' scoped>
.row {
  align-items: center;
  background: #6d6d6d;
}

.col {
  background: #efefef;
}
</style>
