# Upload File

Source: https://api-docs.deepseek.com/api/create-file

POST 

## /files

Upload an image file that can later be referenced by its `file_id` in chat completion requests.

Supported formats: JPEG, PNG, GIF, and WebP. The format is detected from the file content. See the [Files API guide](https://api-docs.deepseek.com/guides/files_api) for details.

## Request[​](https://api-docs.deepseek.com/api/create-file#request "Direct link to Request")

-   multipart/form-data

### 

Body

**

required

**

**file** binaryrequired

The image file to upload. Supported formats: JPEG, PNG, GIF, and WebP. Maximum file size: 64 MiB.

**purpose** stringrequired

**Possible values:** \[`user_data`\]

The intended purpose of the uploaded file. Must be `user_data`.

**expires\_after\[anchor\]** string

**Possible values:** \[`created_at`\]

The anchor for the expiration. Must be `created_at` if provided, and is required together with `expires_after[seconds]`.

**expires\_after\[seconds\]** integer

**Possible values:** `>= 3600` and `<= 2592000`

The lifetime of the file in seconds, between 3600 (1 hour) and 2592000 (30 days). Required together with `expires_after[anchor]`. Omit both `expires_after` fields to keep the file permanently.

## Responses[​](https://api-docs.deepseek.com/api/create-file#responses "Direct link to Responses")

-   200

OK, returns the uploaded `file object`.

-   application/json

-   Schema
-   Example (from schema)
-   Example

**

Schema

**

**id** stringrequired

The file identifier, of the form `file-api-...`, which can be referenced in chat completion requests.

**object** stringrequired

**Possible values:** \[`file`\]

The object type, which is always `file`.

**bytes** integerrequired

The size of the file in bytes.

**created\_at** integerrequired

The Unix timestamp (in seconds) of when the file was created.

**filename** stringrequired

The name of the file.

**purpose** stringrequired

**Possible values:** \[`user_data`\]

The intended purpose of the file.

**expires\_at** integer

The Unix timestamp (in seconds) of when the file expires. Only present when an expiration was set at upload time.

Loading...
