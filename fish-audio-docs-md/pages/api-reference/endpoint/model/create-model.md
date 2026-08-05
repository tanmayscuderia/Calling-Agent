# Create Model

Source: https://docs.fish.audio/api-reference/endpoint/model/create-model

Create Model for Users via API

```
curl --request POST \
  --url https://api.fish.audio/model \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '
{
  "type": "<string>",
  "title": "<string>",
  "train_mode": "<string>",
  "voices": [
    "<string>"
  ],
  "visibility": "public",
  "description": "<string>",
  "cover_image": "<string>",
  "texts": [
    "<string>"
  ],
  "tags": [
    "<string>"
  ],
  "enhance_audio_quality": true,
  "generate_sample": false
}
'
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

POST

/

model

Create Model for Users via API

```
curl --request POST \
  --url https://api.fish.audio/model \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '
{
  "type": "<string>",
  "title": "<string>",
  "train_mode": "<string>",
  "voices": [
    "<string>"
  ],
  "visibility": "public",
  "description": "<string>",
  "cover_image": "<string>",
  "texts": [
    "<string>"
  ],
  "tags": [
    "<string>"
  ],
  "enhance_audio_quality": true,
  "generate_sample": false
}
'
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

Since this endpoint uploads files, use `multipart/form-data` for regular REST requests. Let your HTTP client set the multipart `Content-Type` boundary automatically.

#### Authorizations

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#authorization-authorization)

Authorization

string

header

required

Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

#### Body

application/jsonapplication/x-www-form-urlencodedmultipart/form-dataapplication/msgpack

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#body-type)

type

string

required

Model type, tts is for text to speech

Allowed value: `"tts"`

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#body-title)

title

string

required

Model title or name

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#body-train-mode)

train\_mode

string

required

Model train mode, for TTS model, fast means model instantly available after creation

Allowed value: `"fast"`

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#body-voices-one-of-0)

voices

file\[\]file

required

Upload voices files that will be used to tune the model

Required array length: `1 - 20` elements

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#body-visibility)

visibility

enum<string>

default:public

Model visibility, public will be shown in the discovery page, unlist allows anyone with the link to access, private only be visible to the creator

Available options:

`public`,

`unlist`,

`private`

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#body-description-one-of-0)

description

string | null

Model description

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#body-cover-image-one-of-0)

cover\_image

file | null

Model cover image, this is required if the model is public

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#body-texts-one-of-0)

texts

string\[\]string

Texts corresponding to the voices, if unspecified, ASR will be performed on the voices

Maximum array length: `20`

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#body-tags-one-of-0)

tags

string\[\]string

Model tags

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#body-enhance-audio-quality)

enhance\_audio\_quality

boolean

default:true

Enhance audio quality

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#body-generate-sample)

generate\_sample

boolean

default:false

Generate default text

#### Response

Document created, URL follows

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#response-id)

\_id

string

required

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#response-type)

type

enum<string>

required

Available options:

`svc`,

`tts`

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#response-title)

title

string

required

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#response-state)

state

enum<string>

required

Available options:

`created`,

`training`,

`trained`,

`failed`

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#response-tags)

tags

string\[\]

required

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#response-created-at)

created\_at

string<date-time>

required

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#response-updated-at)

updated\_at

string<date-time>

required

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#response-visibility)

visibility

enum<string>

required

Available options:

`public`,

`unlist`,

`private`

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#response-like-count)

like\_count

integer

required

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#response-mark-count)

mark\_count

integer

required

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#response-shared-count)

shared\_count

integer

required

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#response-task-count)

task\_count

integer

required

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#response-author)

author

AuthorEntity · object

required

Show child attributes

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#response-description)

description

string

default:""

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#response-cover-image)

cover\_image

string

default:""

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#response-train-mode)

train\_mode

enum<string>

default:full

Available options:

`fast`,

`full`

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#response-samples)

samples

SampleEntity · object\[\]

Show child attributes

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#response-languages)

languages

string\[\]

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#response-lock-visibility)

lock\_visibility

boolean

default:false

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#response-dmca-taken-down-one-of-0)

dmca\_taken\_down

boolean | null

default:false

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#response-default-text)

default\_text

string

default:""

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#response-source-one-of-0)

source

string | null

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#response-pvc-release-state-one-of-0)

pvc\_release\_state

enum<string> | null

Available options:

`released`,

`retiring`

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#response-pvc-notice-period-months-one-of-0)

pvc\_notice\_period\_months

integer | null

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#response-pvc-released-at-one-of-0)

pvc\_released\_at

string<date-time> | null

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#response-pvc-retire-requested-at-one-of-0)

pvc\_retire\_requested\_at

string<date-time> | null

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#response-pvc-retire-effective-at-one-of-0)

pvc\_retire\_effective\_at

string<date-time> | null

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#response-quality-one-of-0)

quality

ModelQualityEntity · object | null

Show child attributes

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#response-unliked)

unliked

boolean

default:false

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#response-liked)

liked

boolean

default:false

[​

](https://docs.fish.audio/api-reference/endpoint/model/create-model#response-marked)

marked

boolean

default:false

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/api-reference/endpoint/model/create-model.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/api-reference/endpoint/model/create-model)
