# BYOK overview

Source: https://docs.sarvam.ai/conversations/api/byok/overview

The Bring Your Own Key (BYOK) feature lets you keep control of the encryption keys used to protect your data. Sarvam integrates with a service that **you host** and makes outbound calls to its endpoints to authenticate, request decryption of data keys, and generate new keys during rotation.

## Authentication methods

You can choose one of two ways to authenticate requests coming from Sarvam:

| Method | How it works |
| --- | --- |
| **Client credentials** | Provide Sarvam with a **Client ID** and **Client Secret**. Sarvam calls your `/auth` endpoint to obtain a short-lived JWT, then sends it as a Bearer token on subsequent requests. |
| **Static API key** | Provide Sarvam with a long-lived **API key**. Sarvam sends this key directly as a Bearer token on every request. The `/auth` endpoint is not used in this case. |

## Integration requirements

-   **Host the endpoints.** You must host the BYOK endpoints on a secure HTTPS server.
-   **Whitelist Sarvam’s egress IPs.** Configure your firewall to allow incoming requests from Sarvam’s egress IP addresses. Contact Sarvam support for the current list.
