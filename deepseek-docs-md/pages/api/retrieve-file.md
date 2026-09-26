# Retrieve File

Source: https://api-docs.deepseek.com/api/retrieve-file

GET 

## /files/:file\_id

Returns information about a specific file.

## Request[​](https://api-docs.deepseek.com/api/retrieve-file#request "Direct link to Request")

### 

Path Parameters

**file\_id** stringrequired

The ID of the file to retrieve.

## Responses[​](https://api-docs.deepseek.com/api/retrieve-file#responses "Direct link to Responses")

-   200

OK, returns the `file object`.

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
