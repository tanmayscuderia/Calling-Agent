# Dialing rate & concurrency

Source: https://docs.sarvam.ai/conversations/deploy/campaigns/dialing-rate

When you launch a campaign you control how fast it dials. Two numbers decide how a campaign behaves: **attempts per second** — how quickly calls go out — and **concurrency** — how many conversations are live at the same time. Setting them well keeps a campaign moving without overwhelming your phone numbers, your telephony channels, or your plan’s limits.

## Attempts per second (CPS)

An **attempt** is a single dial to one contact. **Attempts per second** — sometimes called **CPS** (calls per second) or **APS** — is how many new dials the campaign starts each second. It’s the **Attempts per second** field in the [campaign wizard](https://docs.sarvam.ai/conversations/deploy/campaigns/create-campaign), and defaults to `2`.

The same limit is often quoted as **APM** (attempts per minute): `APM = 60 × APS`. Sarvam enforces the per-second ceiling — a `5` APS limit means no more than 5 attempts in any single second. You can’t bank a quiet minute and spend it as a burst.

-   A higher rate works through your list faster; a lower rate is gentler on your numbers.
-   **Every dial is an attempt**, whether or not it connects — busy, no-answer, and failed calls all count.
-   **Retries are attempts too.** Every [retry](https://docs.sarvam.ai/conversations/deploy/campaigns/create-campaign) you configure adds more dials on top of the first pass, so retries increase your effective dialing load.

## Concurrency

**Concurrency** is how many conversations are live **at the same moment**. On the Sarvam side, a call occupies a concurrency slot from the moment the agent and caller start speaking until the call ends — for the full talk time of a connected call. Dialing and ringing hold **no** agent concurrency slot; an unanswered attempt never consumes one.

You don’t set concurrency directly — it follows from how fast you dial, how often calls connect, and how long they last:

```
concurrency ≈ attempts per second × connect rate × average talk time
```

**Example.** At `2` attempts per second, a 60% connect rate, and 90-second conversations: `2 × 0.6 × 90 ≈ 108` conversations live at once. Dial faster or hold longer conversations, and more calls stack up simultaneously.

## Telephony channels

Telephony providers express the same pair of limits — a dial rate (CPS) and a pool of **channels** (concurrent call paths). Which kind of channel you have changes how much capacity you need:

| Channel type | When a channel is seized | Effect of connect rate |
| --- | --- | --- |
| **SIP** | At attempt — ringing holds a channel for the full ring window (about 30s) whether or not the call is answered | Low connect rates inflate channel need, because unanswered dials still occupy channels while ringing |
| **Streaming** | At answer — only while media is flowing | Effectively the same number as agent concurrency; ringing costs nothing |

```
agent_concurrency   = APS × connect_rate × talk_time
streaming_channels  = agent_concurrency
SIP_channels        = APS × (1 − connect_rate) × ring_time  +  APS × connect_rate × talk_time
```

Using a Sarvam-managed Vobiz account? Channel provisioning and provider dial-rate limits are handled at Sarvam’s end. The calculator below is still useful for sizing against your plan’s limits.

## CPS calculator

Work out the **attempts per second** a campaign needs to clear a cohort — including its retry tail — inside a target time window.

Every contact is dialed once. Each retry round only re-dials the contacts that didn’t connect, so the number of attempts shrinks by the connectivity rate each pass.

Cohort size

Contacts to dialNumber of retries

4 attempt rounds in totalConnectivity rate (%)

Share of attempts that are answeredTime window

minhoursdays

\= 28,800 seconds

Attempts per second (CPS)1.19\= 72 attempts per minute

Total attempts34,39010,000 first dials + 24,390 retries

Attempts per round

First dial

10,000

Retry 1

9,000

Retry 2

8,100

Retry 3

7,290

Each retry round only re-dials the contacts that did not connect, so the tail shrinks by the connectivity rate every pass.

This is an average rate across the whole window. Traffic is bursty and your allowed dialing hours may be shorter than the window you picked, so add 20–30% headroom and keep the result below your plan’s CPS ceiling.

## Plan limits are shared

Your plan sets ceilings on **both** total attempts per second and total concurrency, and those ceilings are **shared across everything that dials** — every campaign, instant outbound, and inbound traffic.

-   Two campaigns running at `2` APS each count as `4` APS against your limit.
-   When combined activity pushes past a ceiling, new calls are queued or rejected — so leave headroom rather than running at 100%.
-   Inbound arrives on its own schedule, so reserve capacity for it explicitly when you also run outbound.

## Picking a safe rate

[1](https://docs.sarvam.ai/conversations/deploy/campaigns/dialing-rate#start-at-the-default)

### Start at the default

Launch at `2` attempts per second with a small cohort.

[2](https://docs.sarvam.ai/conversations/deploy/campaigns/dialing-rate#watch-the-first-hour)

### Watch the first hour

Monitor [Connectivity](https://docs.sarvam.ai/conversations/monitor/agent-analytics/connectivity). If connect rates drop sharply, you may be dialing too aggressively — numbers can get flagged as spam. A sustained drop in connect rate also silently inflates SIP channel usage.

[3](https://docs.sarvam.ai/conversations/deploy/campaigns/dialing-rate#recalibrate-with-observed-numbers)

### Recalibrate with observed numbers

Replace assumed connect rate and talk time with values from analytics, re-run the calculator, then raise the rate step by step. See [Best practices](https://docs.sarvam.ai/conversations/deploy/campaigns/best-practices).
