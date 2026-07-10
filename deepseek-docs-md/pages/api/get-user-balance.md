# Get User Balance

Source: https://api-docs.deepseek.com/api/get-user-balance

GET 

## /user/balance

Get user current balance

## Responses[​](https://api-docs.deepseek.com/api/get-user-balance#responses "Direct link to Responses")

-   200

OK, returns user balance info.

-   application/json

-   Schema
-   Example (from schema)
-   Example

**

Schema

**

**is\_available** boolean

Whether the user's balance is sufficient for API calls.

**

balance\_infos

**

object\[\]

-   Array \[
    

**currency** string

**Possible values:** \[`CNY`, `USD`\]

The currency of the balance.

**total\_balance** string

The total available balance, including the granted balance and the topped-up balance.

**granted\_balance** string

The total not expired granted balance.

**topped\_up\_balance** string

The total topped-up balance.

-   \]
    

Loading...
