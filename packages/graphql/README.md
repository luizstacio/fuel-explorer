## Mock API

This is a mock api for block-explorer

## Run development server

```sh
pnpm dev
```

## Example query

```graphql
query {
  transactions(last: 10) {
    pageInfo {
      endCursor
      hasNextPage
      hasPreviousPage
      startCursor
    }
    nodes {
      type: __typename
      id
      isScript
      isCreate
      isMint
      inputs {
        type: __typename
        ... on InputCoin {
          amount
          assetId
          maturity
          owner
          predicate
          txPointer
          utxoId
          witnessIndex
        }
        ... on InputContract {
          balanceRoot
          contract {
            id
            salt
          }
          stateRoot
          txPointer
          utxoId
        }
        ... on InputMessage {
          amount
          data
          messageId
          nonce
          predicate
          predicateData
          recipient
          sender
          witnessIndex
        }
      }
      outputs {
        type: __typename
        ... on ChangeOutput {
          amount
          assetId
          to
        }
        ... on CoinOutput {
          amount
          assetId
          to
        }
        ... on ContractCreated {
          contract {
            id
            salt
          }
          stateRoot
        }
        ... on ContractOutput {
          balanceRoot
          inputIndex
          stateRoot
        }
        ... on MessageOutput {
          amount
          recipient
        }
        ... on VariableOutput {
          amount
          assetId
          to
        }
      }
      status {
        type: __typename
        ... on SubmittedStatus {
          time
        }
        ... on SuccessStatus {
          block {
            id
          }
          time
          programState {
            returnType
            data
          }
        }
        ... on FailureStatus {
          block {
            id
          }
          time
          reason
        }
      }
    }
    tokens {
      assetId
      name
      symbol
    }
    accounts {
      address
      url
      name
    }
  }
}
```
