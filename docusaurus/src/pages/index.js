import React from 'react';
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

export default function Home() {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout
      title={`${ siteConfig.title }`}
      description="Description will go into a meta tag in <head />">
      <div className="row homepage-banner">
        <div className="container">
          <div className="row">
            <div className="col col--8 homepage-banner-img">
              <img src={require('@site/static/img/header-img.jpeg').default} />
            </div>
            <div className="col col--4 homepage-banner-right">
              <h1 className="hero__title">Rancher UI DevKit</h1>
              <p className="hero__subtitle">Rancher UI DevKit provides everything you need to start developing with the Rancher UI and plugins</p>
            </div>
          </div>
        </div>
      </div>
      <main>
        <div className="container featuresContainer">
          <HomepageFeatures />
        </div>
      </main>
    </Layout>
  );
}
