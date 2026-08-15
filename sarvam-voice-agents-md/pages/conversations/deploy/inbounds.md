# Inbounds

Source: https://docs.sarvam.ai/conversations/deploy/inbounds

An **inbound deployment** connects an agent to your phone numbers so it can answer **incoming** calls. This is the receive side of telephony: someone dials your number, and the deployment routes that call to the right agent.

Open **Deploy → Inbounds**.

**Inbound vs. outbound.** Inbound deployments handle calls that come _to_ you (like a support line). To have your agent _dial out_ to a list of people, use [Campaigns](https://docs.sarvam.ai/conversations/deploy/campaigns) instead. They live in separate places because the setup is different: an inbound deployment just routes incoming numbers to an agent, while a campaign needs a contact list and a dialing schedule.

## Before you start

[1](https://docs.sarvam.ai/conversations/deploy/inbounds#connect-telephony)

### Connect telephony

Add a telephony connection: [bring your own provider](https://docs.sarvam.ai/conversations/deploy/telephony/bring-your-own) or [rent a number from Sarvam](https://docs.sarvam.ai/conversations/deploy/telephony/rent-from-sarvam). This is where your phone numbers come from.

[2](https://docs.sarvam.ai/conversations/deploy/inbounds#have-an-agent-ready)

### Have an agent ready

Build and test an agent first. You’ll select it (and a committed version) while creating the deployment.

## Create an inbound deployment

From **Deploy → Inbounds**, click **Create Inbound**. The wizard has three steps.

[1](https://docs.sarvam.ai/conversations/deploy/inbounds#agent)

### Agent

Choose what answers the call and where it comes in:

-   **Agent** - the agent and version to serve. The agent is locked once the deployment exists (you can only change it while paused, or by creating a new deployment).
-   **Connections** - add one or more telephony connections. Use **Add connection** to attach more than one.
-   **Phone numbers** - assign the incoming numbers. Switch between **By number** and **By group** to pick individual numbers or a whole [group](https://docs.sarvam.ai/conversations/deploy/telephony/groups).
-   **Name** - a clear deployment name (and an optional description).

[2](https://docs.sarvam.ai/conversations/deploy/inbounds#availability)

### Availability

Set when the agent accepts calls:

-   **Timezone** - defaults to `Asia/Kolkata (IST)`.
-   **Allowed days** - the days of the week the deployment is active.
-   **Calls allowed between** - the daily window (defaults to `09:00`–`18:00`). Calls outside this window aren’t answered by the agent.

[3](https://docs.sarvam.ai/conversations/deploy/inbounds#review--deploy)

### Review & Deploy

Tick each section once you’ve reviewed it - **Deploy** unlocks when every section is checked. Create the deployment to go live.

After going live, place a real call to the assigned number. test agent catches logic issues, but a phone call surfaces carrier audio, latency, and interruption behavior you can’t see otherwise.

There’s no cohort step in this wizard - inbound callers can’t be enumerated ahead of time, so there’s nothing to upload yet. You can still add a known-caller list once the deployment exists; see **Known callers** under [What’s on a deployment](https://docs.sarvam.ai/conversations/deploy/inbounds#whats-on-a-deployment).

## What’s on a deployment

Open a deployment from the list to see its detail view.

| Section | What it shows |
| --- | --- |
| **Deployment details** | Name, deployment ID, status, who created it, created date, and the assigned phone numbers |
| **Agent details** | Agent ID, name, version, channel type, model, initial language, and speaker |
| **Schedule details** | The allowed time window, timezone, and allowed days |
| **Known callers** | Any known-caller lists attached for personalization (or an empty state if none) |

### Known callers (optional)

Optionally upload a contact list so the agent can personalize responses for known callers. This isn’t part of the create wizard - add it any time after the deployment exists, from the deployment detail page.

-   Upload a CSV of contacts and give the list a name.
-   Map CSV columns to the agent’s [input variables](https://docs.sarvam.ai/conversations/build/variables-personalization).
-   Download the sample CSV if you need the expected format.

Unlike an outbound [campaign](https://docs.sarvam.ai/conversations/deploy/campaigns), this list is **not** a dial list - the deployment never calls these contacts. It only helps the agent recognize and personalize for a caller whose number is already on file.

## Manage a deployment

###### Pause / Resume

Pause a deployment to stop routing new incoming calls to the agent; resume to start again. Calls already in progress finish normally.

###### Edit

Editing is only available while the deployment is **paused**. Pause first, change the connections, phone numbers, or schedule, then resume.

The agent selection is locked after creation. To serve a different agent, create a new deployment.

###### Add known callers

Add a known-caller list at any time from the list row action (**Add known callers**) or the **Known callers** section on the detail page. Upload a CSV and map its columns to agent variables.

###### Delete

Delete a deployment to remove the number-to-agent routing entirely. Incoming calls on those numbers will no longer reach the agent.

### Status reference

| Status | Meaning |
| --- | --- |
| **Active** | Live and routing incoming calls to the agent within the schedule window |
| **Paused** | Routing is suspended; the deployment can be edited |

## Where to go next

[

Phone Numbers

Connect providers, rent numbers, and build groups before deploying.







](https://docs.sarvam.ai/conversations/deploy/telephony)[

Campaigns

Dial an audience with cohorts, scheduling, and retries.







](https://docs.sarvam.ai/conversations/deploy/campaigns)[

Agent Analytics

Monitor incoming call volume, connect rates, and engagement.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics)[

Manage Phone Numbers

Add, assign, release, and archive numbers.







](https://docs.sarvam.ai/conversations/deploy/telephony/manage-numbers)
