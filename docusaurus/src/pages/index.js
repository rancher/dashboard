import React from 'react';
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Contribute from '@site/src/components/Contribute';
// import GettingStarted from '@site/src/components/GettingStarted';
// import Guides from '@site/src/components/Guides';
import styles from './index.module.css';

function HomepageHeader() {
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container homepage-banner">
        <h1 className="hero__title">Rancher UI Extensions</h1>
        <p className="hero__subtitle">Build and publish your own extensions for the Rancher UI</p>
      </div>
    </header>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout
      title={`${ siteConfig.title }`}
      description="Rancher UI Extensions">
      <HomepageHeader />
      <main>
        <section className={styles.features}>
          <div className="container">
            <HomepageFeatures />
            <hr/>
            <Contribute/>
            <hr/>
            {/* <GettingStarted/>
            <hr/>
            <Guides/> */}
          </div>
        </section>
      </main>
    </Layout>
  );
}
