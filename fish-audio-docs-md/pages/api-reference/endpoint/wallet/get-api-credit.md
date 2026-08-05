# Get API Credit

Source: https://docs.fish.audio/api-reference/endpoint/wallet/get-api-credit

Get API Credit

```
curl --request GET \
  --url https://api.fish.audio/wallet/{user_id}/api-credit \
  --header 'Authorization: Bearer <token>'
```

```
{
  "_id": "<string>",
  "user_id": "<string>",
  "credit": "<string>",
  "cumulative_top_up": "<string>",
  "created_at": "2023-11-07T05:31:56Z",
  "updated_at": "2023-11-07T05:31:56Z",
  "has_phone_sha256": true,
  "has_free_credit": true
}
```

GET

/

wallet

/

{user\_id}

/

api-credit

Get API Credit

```
curl --request GET \
  --url https://api.fish.audio/wallet/{user_id}/api-credit \
  --header 'Authorization: Bearer <token>'
```

```
{
  "_id": "<string>",
  "user_id": "<string>",
  "credit": "<string>",
  "cumulative_top_up": "<string>",
  "created_at": "2023-11-07T05:31:56Z",
  "updated_at": "2023-11-07T05:31:56Z",
  "has_phone_sha256": true,
  "has_free_credit": true
}
```

#### Authorizations

[​

](https://docs.fish.audio/api-reference/endpoint/wallet/get-api-credit#authorization-authorization)

Authorization

string

header

required

Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

#### Path Parameters

[​

](https://docs.fish.audio/api-reference/endpoint/wallet/get-api-credit#parameter-user-id)

user\_id

string

default:self

User ID or 'self'

#### Query Parameters

[​

](https://docs.fish.audio/api-reference/endpoint/wallet/get-api-credit#parameter-check-free-credit)

check\_free\_credit

boolean

default:false

[​

](https://docs.fish.audio/api-reference/endpoint/wallet/get-api-credit#parameter-one-of-0)

team\_id

string | null

#### Response

Request fulfilled, document follows

[​

](https://docs.fish.audio/api-reference/endpoint/wallet/get-api-credit#response-id)

\_id

string

required

[​

](https://docs.fish.audio/api-reference/endpoint/wallet/get-api-credit#response-user-id)

user\_id

string

required

[​

](https://docs.fish.audio/api-reference/endpoint/wallet/get-api-credit#response-credit)

credit

string

required

[​

](https://docs.fish.audio/api-reference/endpoint/wallet/get-api-credit#response-cumulative-top-up)

cumulative\_top\_up

string

required

[​

](https://docs.fish.audio/api-reference/endpoint/wallet/get-api-credit#response-created-at)

created\_at

string<date-time>

required

[​

](https://docs.fish.audio/api-reference/endpoint/wallet/get-api-credit#response-updated-at)

updated\_at

string<date-time>

required

[​

](https://docs.fish.audio/api-reference/endpoint/wallet/get-api-credit#response-has-phone-sha256)

has\_phone\_sha256

boolean

required

[​

](https://docs.fish.audio/api-reference/endpoint/wallet/get-api-credit#response-has-free-credit-one-of-0)

has\_free\_credit

boolean | null

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/api-reference/endpoint/wallet/get-api-credit.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/api-reference/endpoint/wallet/get-api-credit)
