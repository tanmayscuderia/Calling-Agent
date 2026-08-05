# Update Model

Source: https://docs.fish.audio/api-reference/endpoint/model/update-model

Update Model

```
curl --request PATCH \
  --url https://api.fish.audio/model/{id} \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '
{
  "title": "<string>",
  "description": "<string>",
  "cover_image": "<string>",
  "tags": [
    "<string>"
  ]
}
'
```

```
{
  "status": 123,
  "message": "<string>"
}
```

PATCH

/

model

/

{id}

Update Model

```
curl --request PATCH \
  --url https://api.fish.audio/model/{id} \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '
{
  "title": "<string>",
  "description": "<string>",
  "cover_image": "<string>",
  "tags": [
    "<string>"
  ]
}
'
```

```
{
  "status": 123,
  "message": "<string>"
}
```

#### Authorizations

[​

](https://docs.fish.audio/api-reference/endpoint/model/update-model#authorization-authorization)

Authorization

string

header

required

Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

#### Path Parameters

[​

](https://docs.fish.audio/api-reference/endpoint/model/update-model#parameter-id)

id

string

required

#### Body

application/jsonapplication/x-www-form-urlencodedmultipart/form-dataapplication/msgpack

[​

](https://docs.fish.audio/api-reference/endpoint/model/update-model#body-title-one-of-0)

title

string | null

[​

](https://docs.fish.audio/api-reference/endpoint/model/update-model#body-description-one-of-0)

description

string | null

[​

](https://docs.fish.audio/api-reference/endpoint/model/update-model#body-cover-image-one-of-0)

cover\_image

file | null

[​

](https://docs.fish.audio/api-reference/endpoint/model/update-model#body-visibility-one-of-0)

visibility

enum<string> | null

Available options:

`public`,

`unlist`,

`private`

[​

](https://docs.fish.audio/api-reference/endpoint/model/update-model#body-tags-one-of-0)

tags

string\[\]string

#### Response

Request fulfilled, document follows

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/api-reference/endpoint/model/update-model.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/api-reference/endpoint/model/update-model)
