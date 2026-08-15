# Introduction

Source: https://docs.sarvam.ai/conversations/api/introduction

The Voice Agents API lets you manage your voice agents programmatically — create deployments, run outbound campaigns, place instant calls, and pull call analytics — without using the dashboard.

## Authentication

All requests are authenticated with an API key sent in the `X-API-Key` header. Create and manage keys from **Settings → API Key** in the dashboard.

```
X-API-Key: <your-api-key>
```

## Base URLs

Endpoints are grouped by service, and each service has its own base URL:

| Service | Base URL |
| --- | --- |
| Deployments | `https://apps.sarvam.ai/api/app-authoring` |
| Campaigns & Cohorts | `https://apps.sarvam.ai/api/scheduling` |
| Instant Outbound | `https://apps.sarvam.ai/api/outbounds` |
| Analytics | `https://apps.sarvam.ai/api` |
| BYOK | Hosted by you — see the BYOK overview |

## Organization and workspace scope

Most endpoints are scoped to an organization and workspace, so their paths include `org_id` and `workspace_id`. Copy these identifiers from your dashboard URL, or from **Settings**.

```
/v1/orgs/{org_id}/workspaces/{workspace_id}/deployments
```
