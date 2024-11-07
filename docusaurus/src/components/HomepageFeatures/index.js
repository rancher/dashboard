import React from 'react';
import clsx from 'clsx';
import styles from '../styles.module.css';
import ExternalLinkIcon from '@site/static/img/external-link.svg';

const FeatureList = [
  {
    title:       'Extensions Documentation',
    link:        'extensions/next/home',
    target:      '',
    Svg:         require('@site/static/img/developer-documentation.svg').default,
    icon:        'hide',
    description: (
      <>
        Learn about Rancher UI Extensions and how to get started building your own Rancher Extension.
      </>
    ),
  },
  {
    title:       'Design Kit',
    link:        'https://rancher.github.io/storybook/',
    target:      '_blank',
    Svg:         require('@site/static/img/components-and-design-kit.svg').default,
    icon:        'show',
    description: (
      <>
        Rancher storybook is a collection of pre-built, reusable assets—components, patterns, and documentation guidance, to help developers to build consistent UI experiences faster.
      </>
    ),
  },
];

function Feature( {
  Svg, title, description, link, target, icon
} ) {
  return (
    <div className={clsx('col col--6')}>
      <a className="featureLink" href={link} target={target}>
        <div className="resourcesSvg">
          <Svg className={styles.featureSvg} role="img" />
        </div>
        <div className="padding-horiz--md">
          <h2 className='exterl-link'>{title}
            <ExternalLinkIcon title="Docusaurus Logo" className={`link-icon ${ icon }`} />
          </h2>
          <p>{description}</p>
        </div>
      </a>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <div>
      <h1>Resources</h1>
      <div className="row">
        {FeatureList.map((props, idx) => (
          <Feature key={idx} {...props} />
        ))}
      </div>
    </div>
  );
}
