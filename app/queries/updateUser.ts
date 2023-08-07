export const UPDATE_USER = `#graphql
mutation updateUser($input:CustomerInput!) {
    customerUpdate(
    input: $input
    ) {
        customer {
        firstName
        lastName
            metafields(first: 10) {
                edges {
                    node {
                    value
                    key
                    id
                    }
                }
            }
        }
    }
}`