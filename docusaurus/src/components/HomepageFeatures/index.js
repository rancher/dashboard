import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
    title:       'Getting Started',
    link:        'getting-started/concepts/',
    target:      '',
    Svg:         require('@site/static/img/documentation.svg').default,
    description: (
      <>
        This section covers the basics of working with the Rancher dashboard. It will familiarize you with the development
        environment, concepts, and new Rancher UI.
      </>
    ),
  },
  {
    title:       'Components & Design kit',
    link:        'https://rancher.github.io/storybook/',
    target:      '_blank',
    Svg:         require('@site/static/img/storybook.svg').default,
    description: (
      <>
        Rancher storybook is a collection of pre-built, reusable assets—components, patterns, and documentation guidance, to help
        developers to build consistent UI experiences faster.
      </>
    ),
  },
];

function Feature( {
  Svg, title, description, link, target
} ) {
  return (
    <div className={clsx('col col--6')}>
      <a className="featureLink" href={link} target={target}>
        <div className="text--center">
          <Svg className={styles.featureSvg} role="img" />
        </div>
        <div className="text--center padding-horiz--md">
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </a>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
