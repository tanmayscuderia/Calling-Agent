# Get User Package

Source: https://docs.fish.audio/api-reference/endpoint/wallet/get-user-package

Get User Package

```
curl --request GET \
  --url https://api.fish.audio/wallet/{user_id}/package \
  --header 'Authorization: Bearer <token>'
```

```
{
  "user_id": "<string>",
  "type": "<string>",
  "total": 123,
  "balance": 123,
  "created_at": "2023-11-07T05:31:56Z",
  "updated_at": "2023-11-07T05:31:56Z",
  "finished_at": "2023-11-07T05:31:56Z",
  "stripe_subscription_id": "<string>",
  "stripe_price_id": "<string>",
  "billing_period": "<string>",
  "current_period_end": "2023-11-07T05:31:56Z",
  "cancel_at_period_end": true,
  "cancel_at": "2023-11-07T05:31:56Z",
  "scheduled_change": {},
  "last_synced_at": "2023-11-07T05:31:56Z",
  "subscription_currency": "<string>",
  "extra_balance": 0,
  "has_used_trial": false
}
```

GET

/

wallet

/

{user\_id}

/

package

Get User Package

```
curl --request GET \
  --url https://api.fish.audio/wallet/{user_id}/package \
  --header 'Authorization: Bearer <token>'
```

```
{
  "user_id": "<string>",
  "type": "<string>",
  "total": 123,
  "balance": 123,
  "created_at": "2023-11-07T05:31:56Z",
  "updated_at": "2023-11-07T05:31:56Z",
  "finished_at": "2023-11-07T05:31:56Z",
  "stripe_subscription_id": "<string>",
  "stripe_price_id": "<string>",
  "billing_period": "<string>",
  "current_period_end": "2023-11-07T05:31:56Z",
  "cancel_at_period_end": true,
  "cancel_at": "2023-11-07T05:31:56Z",
  "scheduled_change": {},
  "last_synced_at": "2023-11-07T05:31:56Z",
  "subscription_currency": "<string>",
  "extra_balance": 0,
  "has_used_trial": false
}
```

#### Authorizations

[​

](https://docs.fish.audio/api-reference/endpoint/wallet/get-user-package#authorization-authorization)

Authorization

string

header

required

Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

#### Path Parameters

[​

](https://docs.fish.audio/api-reference/endpoint/wallet/get-user-package#parameter-user-id)

user\_id

string

default:self

User ID or 'self'

#### Response

Request fulfilled, document follows

[​

](https://docs.fish.audio/api-reference/endpoint/wallet/get-user-package#response-user-id)

user\_id

string

required

[​

](https://docs.fish.audio/api-reference/endpoint/wallet/get-user-package#response-type)

type

string

required

[​

](https://docs.fish.audio/api-reference/endpoint/wallet/get-user-package#response-total)

total

integer

required

[​

](https://docs.fish.audio/api-reference/endpoint/wallet/get-user-package#response-balance)

balance

integer

required

[​

](https://docs.fish.audio/api-reference/endpoint/wallet/get-user-package#response-created-at)

created\_at

string<date-time>

required

[​

](https://docs.fish.audio/api-reference/endpoint/wallet/get-user-package#response-updated-at)

updated\_at

string<date-time>

required

[​

](https://docs.fish.audio/api-reference/endpoint/wallet/get-user-package#response-finished-at)

finished\_at

string<date-time>

required

[​

](https://docs.fish.audio/api-reference/endpoint/wallet/get-user-package#response-stripe-subscription-id-one-of-0)

stripe\_subscription\_id

string | null

[​

](https://docs.fish.audio/api-reference/endpoint/wallet/get-user-package#response-stripe-price-id-one-of-0)

stripe\_price\_id

string | null

[​

](https://docs.fish.audio/api-reference/endpoint/wallet/get-user-package#response-billing-period-one-of-0)

billing\_period

string | null

[​

](https://docs.fish.audio/api-reference/endpoint/wallet/get-user-package#response-current-period-end-one-of-0)

current\_period\_end

string<date-time> | null

[​

](https://docs.fish.audio/api-reference/endpoint/wallet/get-user-package#response-cancel-at-period-end-one-of-0)

cancel\_at\_period\_end

boolean | null

[​

](https://docs.fish.audio/api-reference/endpoint/wallet/get-user-package#response-cancel-at-one-of-0)

cancel\_at

string<date-time> | null

[​

](https://docs.fish.audio/api-reference/endpoint/wallet/get-user-package#response-scheduled-change-one-of-0)

scheduled\_change

Scheduled Change · object | null

[​

](https://docs.fish.audio/api-reference/endpoint/wallet/get-user-package#response-last-synced-at-one-of-0)

last\_synced\_at

string<date-time> | null

[​

](https://docs.fish.audio/api-reference/endpoint/wallet/get-user-package#response-subscription-currency-one-of-0)

subscription\_currency

string | null

[​

](https://docs.fish.audio/api-reference/endpoint/wallet/get-user-package#response-extra-balance-one-of-0)

extra\_balance

integer | null

default:0

[​

](https://docs.fish.audio/api-reference/endpoint/wallet/get-user-package#response-has-used-trial)

has\_used\_trial

boolean

default:false

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/api-reference/endpoint/wallet/get-user-package.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/api-reference/endpoint/wallet/get-user-package)
