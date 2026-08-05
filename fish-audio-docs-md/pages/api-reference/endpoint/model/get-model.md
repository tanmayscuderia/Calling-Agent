# Get Model

Source: https://docs.fish.audio/api-reference/endpoint/model/get-model

Get Model

```
curl --request GET \
  --url https://api.fish.audio/model/{id} \
  --header 'Authorization: Bearer <token>'
```

```
{
  "_id": "<string>",
  "title": "<string>",
  "tags": [
    "<string>"
  ],
  "created_at": "2023-11-07T05:31:56Z",
  "updated_at": "2023-11-07T05:31:56Z",
  "like_count": 123,
  "mark_count": 123,
  "shared_count": 123,
  "task_count": 123,
  "author": {
    "_id": "<string>",
    "nickname": "<string>",
    "avatar": "<string>"
  },
  "description": "",
  "cover_image": "",
  "train_mode": "full",
  "samples": [],
  "languages": [],
  "lock_visibility": false,
  "dmca_taken_down": false,
  "default_text": "",
  "source": "<string>",
  "pvc_notice_period_months": 123,
  "pvc_released_at": "2023-11-07T05:31:56Z",
  "pvc_retire_requested_at": "2023-11-07T05:31:56Z",
  "pvc_retire_effective_at": "2023-11-07T05:31:56Z",
  "quality": {
    "created_at": "2023-11-07T05:31:56Z",
    "updated_at": "2023-11-07T05:31:56Z",
    "audios": [
      {
        "filename": "<string>",
        "duration_ms": 123,
        "language": "unknown",
        "quality": {},
        "quality_passed": false,
        "quality_reason": ""
      }
    ]
  },
  "unliked": false,
  "liked": false,
  "marked": false
}
```

GET

/

model

/

{id}

Get Model

```
curl --request GET \
  --url https://api.fish.audio/model/{id} \
  --header 'Authorization: Bearer <token>'
```

```
{
  "_id": "<string>",
  "title": "<string>",
  "tags": [
    "<string>"
  ],
  "created_at": "2023-11-07T05:31:56Z",
  "updated_at": "2023-11-07T05:31:56Z",
  "like_count": 123,
  "mark_count": 123,
  "shared_count": 123,
  "task_count": 123,
  "author": {
    "_id": "<string>",
    "nickname": "<string>",
    "avatar": "<string>"
  },
  "description": "",
  "cover_image": "",
  "train_mode": "full",
  "samples": [],
  "languages": [],
  "lock_visibility": false,
  "dmca_taken_down": false,
  "default_text": "",
  "source": "<string>",
  "pvc_notice_period_months": 123,
  "pvc_released_at": "2023-11-07T05:31:56Z",
  "pvc_retire_requested_at": "2023-11-07T05:31:56Z",
  "pvc_retire_effective_at": "2023-11-07T05:31:56Z",
  "quality": {
    "created_at": "2023-11-07T05:31:56Z",
    "updated_at": "2023-11-07T05:31:56Z",
    "audios": [
      {
        "filename": "<string>",
        "duration_ms": 123,
        "language": "unknown",
        "quality": {},
        "quality_passed": false,
        "quality_reason": ""
      }
    ]
  },
  "unliked": false,
  "liked": false,
  "marked": false
}
```

#### Authorizations

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#authorization-authorization)

Authorization

string

header

required

Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

#### Path Parameters

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#parameter-id)

id

string

required

#### Response

Request fulfilled, document follows

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#response-id)

\_id

string

required

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#response-type)

type

enum<string>

required

Available options:

`svc`,

`tts`

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#response-title)

title

string

required

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#response-state)

state

enum<string>

required

Available options:

`created`,

`training`,

`trained`,

`failed`

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#response-tags)

tags

string\[\]

required

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#response-created-at)

created\_at

string<date-time>

required

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#response-updated-at)

updated\_at

string<date-time>

required

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#response-visibility)

visibility

enum<string>

required

Available options:

`public`,

`unlist`,

`private`

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#response-like-count)

like\_count

integer

required

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#response-mark-count)

mark\_count

integer

required

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#response-shared-count)

shared\_count

integer

required

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#response-task-count)

task\_count

integer

required

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#response-author)

author

AuthorEntity · object

required

Show child attributes

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#response-description)

description

string

default:""

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#response-cover-image)

cover\_image

string

default:""

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#response-train-mode)

train\_mode

enum<string>

default:full

Available options:

`fast`,

`full`

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#response-samples)

samples

SampleEntity · object\[\]

Show child attributes

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#response-languages)

languages

string\[\]

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#response-lock-visibility)

lock\_visibility

boolean

default:false

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#response-dmca-taken-down-one-of-0)

dmca\_taken\_down

boolean | null

default:false

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#response-default-text)

default\_text

string

default:""

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#response-source-one-of-0)

source

string | null

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#response-pvc-release-state-one-of-0)

pvc\_release\_state

enum<string> | null

Available options:

`released`,

`retiring`

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#response-pvc-notice-period-months-one-of-0)

pvc\_notice\_period\_months

integer | null

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#response-pvc-released-at-one-of-0)

pvc\_released\_at

string<date-time> | null

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#response-pvc-retire-requested-at-one-of-0)

pvc\_retire\_requested\_at

string<date-time> | null

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#response-pvc-retire-effective-at-one-of-0)

pvc\_retire\_effective\_at

string<date-time> | null

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#response-quality-one-of-0)

quality

ModelQualityEntity · object | null

Show child attributes

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#response-unliked)

unliked

boolean

default:false

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#response-liked)

liked

boolean

default:false

[​

](https://docs.fish.audio/api-reference/endpoint/model/get-model#response-marked)

marked

boolean

default:false

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/api-reference/endpoint/model/get-model.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/api-reference/endpoint/model/get-model)
