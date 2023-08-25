export const DELETE_USER = `#graphql
  mutation customerDelete($id: ID!) {
    customerDelete(input: { id: $id }) {
      shop {
        id
      }
      userErrors {
        field
        message
      }
      deletedCustomerId
    }
  }
`
