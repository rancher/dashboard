<template>
  <div class="root">
    <header>
      <n-link to="/">
        Left
      </n-link>

      <div class="header-right">
        Right
      </div>
    </header>

    <div class="middle">
      <nav>
        <ul class="list-unstyled">
          <li>Package 1</li>
          <li>Package 2</li>
          <li>Package 3</li>
          <n-link tag="li" to="explorer">
            <a>Explorer</a>
          </n-link>
        </ul>

        <div class="logo">
          <img src="~/assets/images/logo.svg" alt="logo" width="100%" />
        </div>
      </nav>

      <main>
        <nuxt />
      </main>
    </div>

    <footer>
      Footer stuff
    </footer>
  </div>
</template>

<script>
export default {
  head() {
    return { bodyAttrs: { class: 'theme-dark' } }
  }
}
</script>

<style lang="scss" scoped>
  .root {
    display: flex;
    min-height: 100vh;
    flex-direction: column;
  }

  .middle {
    display: flex;
    flex: 1;
  }

  $header-height: 70px;
  $nav-width: 200px;

  HEADER {
    height: $header-height;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--header-bg);
    padding: 10px;

    .nav-user {
      margin: 0;
      display: flex;

      LI {
        list-style-type: none;
      }

      .btn {
        padding: 0;
      }
    }

    .header-right {
      display: flex;
      background-color: var(--header-bg);

      .nav-account {
        font-size: 3rem;
      }

      .nav-create {
        font-size: 3rem;
      }
    }
  }

  NAV {
    position: relative;
    background-color: var(--nav-bg);
    flex: 0 0 $nav-width;
    padding: 40px 20px;

    .project-dropdown {
      width: 100%;
      margin-bottom: 10px;
      background: var(--nav-select);
      height: 35px;
    }

    LI.active {
      background-color: var(--border);
    }

    .logo {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      text-align: center;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: solid thin var(--border);
      padding: 20px;
    }

    ul {
      li {
        a {
          display: block;
          font-size: 12px;
          border-bottom: solid thin var(--border);
          padding: 10px;
        }
      }
    }
  }

  MAIN {
    flex: 1;
    padding: 40px;
  }

  FOOTER {
    background-color: var(--footer-bg);
  }
</style>
