import React from 'react';
import clsx from 'clsx';
import styles from '../styles.module.css';
import ExternalLinkIcon from '@site/static/img/external-link.svg';

const GettingStartedList = [
  {
    title:       'Quick start',
    link:        'getting-started/quickstart',
    target:      '',
    Svg:         require('@site/static/img/quickstart.svg').default,
    classname:   'midnight-blue',
    description: (
      <>
        Get your Rancher UI for development up and running in just a few seconds.
      </>
    ),
  },
  {
    title:       'Extensions',
    link:        'extensions/home',
    target:      '',
    Svg:         require('@site/static/img/extensions.svg').default,
    classname:   'jungle-green',
    description: (
      <>
        Learn how to add new functionality to the Rancher Dashboard UI at runtime.
      </>
    ),
  },
  {
    title:       'Concepts',
    link:        'getting-started/concepts',
    target:      '',
    Svg:         require('@site/static/img/concepts.svg').default,
    classname:   'primary-active',
    description: (
      <>
        Start learning the background concepts behind Rancher, Kubernetes and containers.
      </>
    ),
  },
  {
    title:       'Development Environment',
    link:        'getting-started/development_environment',
    target:      '',
    Svg:         require('@site/static/img/dev-environment.svg').default,
    classname:   'waterhole-blue',
    description: (
      <>
        If you know Vue, Vuex and Nuxt, this is where you will understand how the Dashboard UI is glued together.
      </>
    ),
  },
  {
    title:       'API',
    link:        'code-base-works/api-resources-and-schemas',
    target:      '',
    Svg:         require('@site/static/img/api.svg').default,
    classname:   'pine-green',
    description: (
      <>
        Learn about the older (opinionated) and newer (unopinionated) Rancher APIs: Norman and Steve
      </>
    ),
  },
  {
    title:       'UI Walkthrough',
    link:        'getting-started/ui-walkthrough',
    target:      '',
    Svg:         require('@site/static/img/ui-walkthrough.svg').default,
    classname:   'primary-hover',
    description: (
      <>
        Find your way through Rancher UI sections: Navigation, Cluster Provisioning, Config, Users, Charts, Plugins, etc.
      </>
    ),
  },
];

function GettingStarted( {
  Svg, title, description, link, target, classname
} ) {
  return (
    <div className={clsx('col col--4')}>
      <a className="gettingStartedLink" href={link} target={target}>
        <div className={`resourcesSvg ${ classname }`}>
          <Svg className={styles.featureSvg} role="img" />
        </div>
        <div>
          <h2 className='exterl-link'>
            {title}
            <ExternalLinkIcon title="Docusaurus Logo" className={`link-icon`} />
          </h2>
          <p>{description}</p>
        </div>
      </a>
    </div>
  );
}

export default function GettingStartedFeatures() {
  return (
    <div>
      <h1>Getting started</h1>
      <div className="row">
        {GettingStartedList.map((props, idx) => (
          <GettingStarted key={idx} {...props} />
        ))}
      </div>
    </div>
  );
}
