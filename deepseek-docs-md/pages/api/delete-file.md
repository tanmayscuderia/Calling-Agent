# Delete File

Source: https://api-docs.deepseek.com/api/delete-file

DELETE 

## /files/:file\_id

Deletes a file.

## Request[​](https://api-docs.deepseek.com/api/delete-file#request "Direct link to Request")

### 

Path Parameters

**file\_id** stringrequired

The ID of the file to delete.

## Responses[​](https://api-docs.deepseek.com/api/delete-file#responses "Direct link to Responses")

-   200

OK, returns the deletion status.

-   application/json

-   Schema
-   Example (from schema)
-   Example

**

Schema

**

**id** stringrequired

The ID of the deleted file.

**object** stringrequired

**Possible values:** \[`file`\]

The object type, which is always `file`.

**deleted** booleanrequired

Whether the file was successfully deleted.

Loading...
