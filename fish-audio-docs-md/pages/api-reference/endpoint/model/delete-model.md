# Delete Model

Source: https://docs.fish.audio/api-reference/endpoint/model/delete-model

Delete Model

```
curl --request DELETE \
  --url https://api.fish.audio/model/{id} \
  --header 'Authorization: Bearer <token>'
```

```
{
  "status": 123,
  "message": "<string>"
}
```

DELETE

/

model

/

{id}

Delete Model

```
curl --request DELETE \
  --url https://api.fish.audio/model/{id} \
  --header 'Authorization: Bearer <token>'
```

```
{
  "status": 123,
  "message": "<string>"
}
```

#### Authorizations

[​

](https://docs.fish.audio/api-reference/endpoint/model/delete-model#authorization-authorization)

Authorization

string

header

required

Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

#### Path Parameters

[​

](https://docs.fish.audio/api-reference/endpoint/model/delete-model#parameter-id)

id

string

required

#### Response

Request fulfilled, document follows

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/api-reference/endpoint/model/delete-model.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/api-reference/endpoint/model/delete-model)
