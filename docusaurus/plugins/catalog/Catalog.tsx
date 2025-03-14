// Shows a set of cards for the catalog for a given group

import DATA from '../../.docusaurus/catalog.json'
import CatalogCard from './CatalogCard.tsx'
import './styles.css';

const Catalog = (props) => {
  const group = props.group;

  const thisGroup = DATA.filter((item) => item.group === group);

  const listItems = thisGroup.map((link) =>
    <CatalogCard item={link} />
  );

  return (
    <div>
      <div className="catalog-card-container">
        {listItems}
      </div>
      {!thisGroup.length && <div className="catalog-card-none">Be the first to contribute an extension!</div>}
    </div>
  );
};

export default Catalog;
