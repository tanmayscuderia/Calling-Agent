# Authentication

Source: https://docs.fish.audio/developer-guide/sdk-guide/python/authentication

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/python/authentication#get-your-api-key)

Get Your API Key

Create a Fish Audio account

Sign up for a free Fish Audio account to get started with our API.

1.  Go to [fish.audio/auth/signup](https://fish.audio/auth/signup)
2.  Fill in your details to create an account, complete steps to verify your account.
3.  Log in to your account and navigate to the [API section](https://fish.audio/app/api-keys)

Get your API key

Once you have an account, you’ll need an API key to authenticate your requests.

1.  Log in to your [Fish Audio Dashboard](https://fish.audio/app/api-keys/)
2.  Navigate to the API Keys section
3.  Click “Create New Key” and give it a descriptive name, set a expiration if desired
4.  Copy your key and store it securely

Keep your API key secret! Never commit it to version control or share it publicly.

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/python/authentication#client-initialization)

Client Initialization

Initialize the [`FishAudio`](https://docs.fish.audio/api-reference/sdk/python/client#fishaudio-objects) client with your API key:

-   Environment Variable (Recommended)
    
-   Direct API Key
    
-   Custom Base URL
    

The most secure approach is using environment variables:

```
from fishaudio import FishAudio

# Automatically reads from FISH_API_KEY environment variable
client = FishAudio()
```

Set the environment variable in your shell:

```
export FISH_API_KEY=your_api_key_here
```

Or create a `.env` file in your project root:

```
FISH_API_KEY=your_api_key_here
```

Then load it using `python-dotenv`:

```
from dotenv import load_dotenv
from fishaudio import FishAudio

# Load environment variables from .env file
load_dotenv()

client = FishAudio()
```

Using environment variables keeps your API key out of your codebase and makes it easy to use different keys for development and production.

Provide the API key directly when initializing the client:

```
from fishaudio import FishAudio

client = FishAudio(api_key="your_api_key_here")
```

This approach is less secure. Never commit code containing your actual API key. Use this only for quick testing or when loading the key from a secure secrets manager.

If you’re using a proxy or custom endpoint:

```
from fishaudio import FishAudio

client = FishAudio(
    api_key="your_api_key",
    base_url="https://your-proxy-domain.com"
)
```

This is useful for:

-   Corporate proxies
-   Development/staging environments
-   Self-hosted deployments

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/python/authentication#verifying-authentication)

Verifying Authentication

Test your authentication by making a simple API call to check your account credits:

```
from fishaudio import FishAudio
from fishaudio.exceptions import AuthenticationError

try:
    client = FishAudio()

    # Check account credits (requires valid authentication)
    credits = client.account.get_credits()
    print(f"Authentication successful! Credits: {credits.credit}")

except AuthenticationError:
    print("Authentication failed. Check your API key.")
```

Handle [`AuthenticationError`](https://docs.fish.audio/api-reference/sdk/python/exceptions#authenticationerror-objects) when verifying authentication. The example uses [`get_credits()`](https://docs.fish.audio/api-reference/sdk/python/resources#get_credits) to verify the authentication works.

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/python/authentication#next-steps)

Next Steps

## Text-to-Speech

Generate speech with the authenticated client

## Voice Cloning

Clone voices and create custom models

## Account Management

Check credits and manage your account

## Error Handling

Handle authentication errors properly

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/developer-guide/sdk-guide/python/authentication.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/developer-guide/sdk-guide/python/authentication)
