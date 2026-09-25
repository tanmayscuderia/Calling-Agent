# List Files

Source: https://api-docs.deepseek.com/api/list-files

GET 

## /files

Returns a list of files that belong to the user, with cursor-based pagination.

## Request[​](https://api-docs.deepseek.com/api/list-files#request "Direct link to Request")

### 

Query Parameters

**after** string

A `file_id` cursor for pagination. Returns files listed after this one.

**limit** integer

**Possible values:** `>= 1` and `<= 1000`

**Default value:** `1000`

The number of files to return. Must be between 1 and 1000.

**order** string

**Possible values:** \[`asc`, `desc`\]

**Default value:** `asc`

Sort order by creation time. `asc` for ascending, `desc` for descending.

**purpose** string

**Possible values:** \[`user_data`\]

Only return files with the given purpose. Only `user_data` is supported.

## Responses[​](https://api-docs.deepseek.com/api/list-files#responses "Direct link to Responses")

-   200

OK, returns a list of `file object`.

-   application/json

-   Schema
-   Example (from schema)
-   Example

**

Schema

**

**object** stringrequired

**Possible values:** \[`list`\]

The object type, which is always `list`.

**

data

**

object\[\]

required

The list of file objects.

-   Array \[
    

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

-   \]
    

**first\_id** string

The ID of the first file in the list. Useful as a pagination cursor.

**last\_id** string

The ID of the last file in the list. Useful as a pagination cursor.

**has\_more** booleanrequired

Whether there are more files beyond this page.

Loading...
