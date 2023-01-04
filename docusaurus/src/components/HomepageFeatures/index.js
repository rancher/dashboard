import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
    featureClass:   'developer-section',
    title:          'Developer Documentation',
    link:           'home',
    target:         '',
    Svg:            require('@site/static/img/documentation.svg').default,
    description:    (
      <>
        This section covers the basics of working with the Rancher UI. It will familiarize you with the development
        environment, concepts, extensions and new Rancher UI.
      </>
    ),
  },
  {
    featureClass:   'components-section',
    title:          'Components & Design kit',
    link:           'https://rancher.github.io/storybook/',
    target:         '_blank',
    Svg:            require('@site/static/img/storybook.svg').default,
    description:    (
      <>
        Rancher storybook is a collection of pre-built, reusable assets—components, patterns, and documentation guidance, to help
        developers to build consistent UI experiences faster.
      </>
    ),
  },
];

function Feature( {
  Svg, title, description, link, target, featureClass
} ) {
  return (
    <div className= {`col col--6 featureSection ${ featureClass }`}>
       <h3>{title}</h3>
      <div className="featureDetails">
        <p>{description}</p>
        <a href={link} target={target}>Go</a>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <div className="row">
      {FeatureList.map((props, idx) => (
        <Feature key={idx} {...props} />
      ))}
    </div>
  );
}
