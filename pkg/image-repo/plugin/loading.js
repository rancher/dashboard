import Vue from 'vue';

Vue.directive('loading', {
  bind(el, binding) {
    updateLoading(el, binding.value);
  },
  update(el, binding) {
    updateLoading(el, binding.value);
  },
  unbind(el) {
    updateLoading(el, false);
  }
});

function updateLoading(el, isLoading) {
  const loadingOverlay = el?.querySelector('.v-loading-mask');

  if (loadingOverlay && loadingOverlay.parentNode) {
    try {
      loadingOverlay.parentNode?.removeChild(loadingOverlay);
    } catch (e) {
      console.log(e); // eslint-disable-line no-console
    }
  }
  const mask = document.createElement('div');

  mask.className = 'v-loading-mask';
  mask.innerHTML = `<div class="v-loading-spinner">
    <i
      v-if="loading"
      class="icon icon-spinner delayed-loader text-primary"
    />
  </div>`;

  if (isLoading) {
    el.appendChild(mask);
    el.style.position = 'relative';
    mask.style.display = 'block';
  } else {
    const loadingOverlay = el.querySelector('.v-loading-mask');

    if (loadingOverlay && loadingOverlay.parentNode) {
      try {
        loadingOverlay.parentNode?.removeChild(loadingOverlay);
      } catch (e) {
        console.log(e); // eslint-disable-line no-console
      }
    }
  }
}
