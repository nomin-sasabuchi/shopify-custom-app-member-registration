export const UPDATE_METAFIELDS = `#graphql
mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafields) {
    metafields {
      value
      key
      id
      type
    }
    userErrors {
      field
      message
    }
  }
}`
