export const GET_USER = `#graphql
query GetUserById($id: ID!) {
  customer(id: $id) {
    id
    email
    firstName
    lastName
    addresses {
      address1
      address2
      city
      company
      phone
      zip
    }
    metafields(first: 100) {
      edges {
        node {
          key
          value
          type
          namespace
        }
      }
    }
  }
}
`
