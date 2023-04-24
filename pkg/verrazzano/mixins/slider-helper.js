// Added by Verrazzano
export default {

  data() {
    const sliderPositions = {};

    // create a slider pane for three elements
    const sliderPane = (slider, onePane, twoPane, name, vertical) => {
      const resizeElement = document.querySelector('body');
      const parentElement = slider.parentElement;

      const resizeObserver = new ResizeObserver(() => {
        // if the resize container was resized in the specified direction,
        // clear any assigned heights or widths

        if (lastDown) {
          if (vertical) {
            if (lastDown.parentSize !== parentElement.offsetHeight) {
              onePane.style.height = null;
              twoPane.style.height = null;
            }
          } else if (lastDown.parentSize !== parentElement.offsetWidth) {
            onePane.style.width = null;
            twoPane.style.width = null;
          }
        }
      });

      let lastDown = {
        e:          null,
        offset:     vertical ? slider.offsetTop : slider.offsetLeft,
        oneSize:    vertical ? onePane.offsetHeight : onePane.offsetWidth,
        twoSize:    vertical ? twoPane.offsetHeight : twoPane.offsetWidth,
        parentSize: vertical ? parentElement.offsetHeight : parentElement.offsetWidth
      };

      const percent = sliderPositions[name];

      if (percent) {
        if (vertical) {
          const oneHeight = Math.round(percent * parentElement.offsetHeight);

          onePane.style.height = `${ oneHeight }px`;
          twoPane.style.height = `${ parentElement.offsetHeight - oneHeight }px`;
        } else {
          const oneWidth = Math.round(percent * parentElement.offsetWidth);

          onePane.style.width = `${ oneWidth }px`;
          twoPane.style.width = `${ parentElement.offsetWidth - oneWidth }px`;
        }
      }

      slider.onmousedown = (e) => {
        lastDown = {
          e,
          offset:     vertical ? slider.offsetTop : slider.offsetLeft,
          oneSize:    vertical ? onePane.offsetHeight : onePane.offsetWidth,
          twoSize:    vertical ? twoPane.offsetHeight : twoPane.offsetWidth,
          parentSize: vertical ? parentElement.offsetHeight : parentElement.offsetWidth
        };

        document.onmousemove = onMouseMove;
        document.onmouseup = onMouseUp;
      };

      function onMouseMove(e) {
        if (vertical) {
          let delta = e.clientY - lastDown.e.clientY;

          delta = Math.min(Math.max(delta, -lastDown.oneSize), lastDown.twoSize);

          onePane.style.height = `${ lastDown.oneSize + delta }px`;
          twoPane.style.height = `${ lastDown.twoSize - delta }px`;
        } else { // horizontal
          let delta = e.clientX - lastDown.e.clientX;

          delta = Math.min(Math.max(delta, -lastDown.oneSize), lastDown.twoSize);

          onePane.style.width = `${ lastDown.oneSize + delta }px`;
          twoPane.style.width = `${ lastDown.twoSize - delta }px`;
        }
      }

      function onMouseUp() {
        document.onmousemove = document.onmouseup = null;

        const oneSize = vertical ? onePane.offsetHeight : onePane.offsetWidth;

        sliderPositions[name] = oneSize / lastDown.parentSize;
      }

      function destroy() {
        resizeObserver.unobserve(resizeElement);
      }

      resizeObserver.observe(resizeElement);

      return { destroy };
    };

    function create(slider, onePane, twoPane, name, vertical) {
      return new sliderPane(slider, onePane, twoPane, name, vertical);
    }

    return { sliderHelper: { create } };
  },

};
