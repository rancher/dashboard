<script>
export default {};
</script>

<template>
  <div class="application-card mt-20">
    <div
      class="application-card-icon"
      data-testid="cardIcon-section"
    >
      <slot name="cardIcon" />
    </div>
    <div class="application-card-details">
      <div class="application-card-details-top">
        <div data-testid="top-left-section">
          <slot name="top-left" />
        </div>
        <div data-testid="top-right-section">
          <slot name="top-right" />
        </div>
      </div>
      <div
        class="application-card-details-bottom"
        data-testid="resourcesCount-section"
      >
        <slot name="resourcesCount" />
      </div>
    </div>
  </div>
</template>

<style lang='scss'>
 .application-card {
    display: flex;
    flex-direction: row;
    outline: 1px solid var(--border);
    border-radius: var(--border-radius);

    @media only screen and (max-width: map-get($breakpoints, '--viewport-9')) {
      flex-direction: column;
    }

    &-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;

      i {
        font-size: 60px;
        opacity: 0.7;
      }

      @media only screen and (max-width: map-get($breakpoints, '--viewport-9')) {
        padding-bottom: 0;
      }
    }

    &-details {
      display: flex;
      flex-direction: column;
      padding: 20px;
      width: 100%;
      flex: 1;

      &-top, &-bottom {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
      }

      &-top {
        display: flex;
        align-items: center;
        padding: 20px 0;
        border-bottom: 1px solid var(--border );

        & > div {
          display: flex;
          flex-direction: column;
          justify-content: center;

          h1 {
            margin: 0;
            padding: 0;
            font-size: $font-size-h2
          }

          ul {
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: row;
            justify-content: space-between;

            @media only screen and (max-width: map-get($breakpoints, '--viewport-9')) {
             flex-direction: column;
            }

            li {
              list-style: none;
              padding-right: 16px;
            }
          }
        }

        & > div:nth-child(2) {
          display: flex;
          padding: 5px 0;
          align-items: flex-end;

          span {
            padding: 5px 0;
          }
        }
      }

      &-bottom {
        display: grid;
        grid-auto-columns: minmax(0, 1fr);
        grid-auto-flow: column;
        grid-gap: 10px;
        padding: 30px 0 15px 0;
        font-size: 18px;
        font-weight: 300;

        div {
          display: flex;
          place-content: center;
          border-right: 1px solid var(--border);
          padding-right: 10px;

          &:last-child {
            border-right: 0;
            padding-right: 0%;
          }
        }
      }

      @media only screen and (max-width: map-get($breakpoints, '--viewport-9')) {
        padding-top: 0;
      }
    }
 }
</style>
