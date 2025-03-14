// Catalog card for a single extension

const CatalogCard = (props) => {
  console.log(props);

  const item = props.item;

  return (
    <div className="catalog-card">
      <div className="catalog-card-icon">
        <img src={ item.icon } />
      </div>
      <div className="catalog-card-metadata">
        <div>{ item.name }</div>
        <div>by <a href={ item.authorUrl } target="_blank">{ item.author }</a></div>
        <div>{ item.description }</div>
        <div className="catalog-more-info"><a href={item.url} target="_blank">Learn More...</a></div>
      </div>
    </div>
  );
};

export default CatalogCard;
