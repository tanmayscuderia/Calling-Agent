# Lists Models

Source: https://api-docs.deepseek.com/api/list-models

GET 

## /models

Lists the currently available models, and provides basic information about each one such as the owner and availability. Check [Models & Pricing](https://api-docs.deepseek.com/quick_start/pricing) for our currently supported models.

## Responses[​](https://api-docs.deepseek.com/api/list-models#responses "Direct link to Responses")

-   200

OK, returns A list of models

-   application/json

-   Schema
-   Example (from schema)
-   Example

**

Schema

**

**object** stringrequired

**Possible values:** \[`list`\]

**

data

**

Model\[\]

required

-   Array \[
    

**id** stringrequired

The model identifier, which can be referenced in the API endpoints.

**object** stringrequired

**Possible values:** \[`model`\]

The object type, which is always "model".

**owned\_by** stringrequired

The organization that owns the model.

-   \]
    

Loading...
