export const QUERY_ACCOUNT_BALANCE: string = `
query GetAccountBalance {
  viewer {
      savingsAccount {
          currentSavingsBalance {
              netAmount
          }
      }
  }
}
`;

export const QUERY_ACCOUNT_FEED_PAGINATED: string = `
query feed_items($cursor: String) {
  viewer {
    savingsAccount {
      feedItems(cursor: $cursor) {
        pageInfo {
          hasNextPage
        }
        edges {
          cursor
          node {
            id
            title
            detail
            postDate
            displayDate
            footer
            strikethrough
            showClock
            iconKey
            detailsDeeplink
            tags
            kind
          }
        }
      }
    }
  }
}
`;

export const QUERY_ACCOUNT_FEED: string = `
query GetAccountFeed {
  viewer {
      savingsAccount {
          id
          feed {
              id
              __typename
              title
              detail
              postDate
              ... on TransferInEvent {
                  amount
                  originAccount {
                      name
                  }
              }
              ... on TransferOutEvent {
                  amount
                  destinationAccount {
                      name
                  }
              }
              ... on TransferOutReversalEvent {
                  amount
              }
              ... on BillPaymentEvent {
                  amount
              }
              ... on DebitPurchaseEvent {
                  amount
              }
              ... on BarcodePaymentEvent {
                  amount
              }
              ... on DebitWithdrawalFeeEvent {
                  amount
              }
              ... on DebitWithdrawalEvent {
                  amount
              }    
          }
      }
  }
}
`;

export const QUERY_ACCOUNT_ID: string = `
query RequestMoney {
  viewer {
    ...RequestMoney_viewer
    id
  }
}

fragment RequestMoney_viewer on Customer {
  savingsAccount {
    id
  }
}
`;

export const QUERY_ACCOUNT_INVESTMENTS: string = `
query GetAccountInvestments {
  viewer {
    savingsAccount {
      redeemableDeposits {
        id
        rate
        vehicle
        openDate
        maturityDate
        principal
        redeemedBalance {
          netAmount
          yield
          incomeTax
          iofTax
          id
        }
      }
    }
  }
}
`;

export const QUERY_GET_PIX_KEYS: string = `
query GetCustomerKeys {
  viewer {
    name
    maskedTaxId
    savingsAccount {
      id
      dict {
        keys(onlyActive: true) {
          id
          kind
          value
          formattedValue
          itemDeepLink
          badge
        }
      }
    }
  }
}
`;

export const MUTATION_CREATE_BOLETO: string = `
mutation createBoleto(
  $input: CreateTransferInBoletoInput!
) {
  createTransferInBoleto(input: $input) {
    boleto {
      id
      dueDate
      barcode
      readableBarcode
      amount
    }
  }
}
`;

export const MUTATION_CREATE_MONEY_REQUEST: string = `
mutation createMoneyRequest($input: CreateMoneyRequestInput!) {
  createMoneyRequest(input: $input) {
    moneyRequest {
      amount
      message
      url
      id
    }
  }
}
`;

export const MUTATION_CREATE_PIX_MONEY_REQUEST: string = `
mutation createPaymentRequest($createPaymentRequestInput: CreatePaymentRequestInput) {
  createPaymentRequest(input: $createPaymentRequestInput) {
    paymentRequest {
      id
      amount
      message
      url
      transactionId
      pixAlias
      brcode
    }
  }
}
`;

export const MUTATION_GET_PIX_TXID: string = `
query get_generic_receipt_screen($type: String!, $id: ID!) {
  viewer {
    savingsAccount {
      getGenericReceiptScreen(type: $type, id: $id) {
        screenShowShareAction
        screenType
        screenPieces {
          __typename
          fallbackMessage
          ... on ReceiptHeaderPiece {
            headerTitle
            headerSubtitle
          }
          ... on ReceiptMessagePiece {
            messageTitle
            messageContent
          }
          ... on ReceiptFooterPiece {
            footerTitle
            footerContent
          }
          ... on ReceiptTablePiece {
            tableHeader {
              icon
              title
              subtitle
              deeplinkWithMeta {
                href
                analytics {
                  key
                  value
                }
              }
            }
            tableItems {
              label
              value
            }
          }
        }
      }
    }
  }
}
`;