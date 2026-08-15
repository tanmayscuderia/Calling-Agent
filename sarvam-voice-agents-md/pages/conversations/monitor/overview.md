# Overview

Source: https://docs.sarvam.ai/conversations/monitor/overview

Monitor is where you review how your deployed agents perform in production. It brings together connection health, conversation quality, individual call records, and custom reporting in one place.

Open **Monitor**. It contains two areas:

-   **Agent Analytics** — ready-made dashboards for day-to-day health checks and call investigation, covering connect rates, engagement, call logs, and turn-level debugging.
-   **Boards** — custom reports you build with SQL when the fixed Agent Analytics tabs do not cover what you need.

## Choosing where to start

Use Agent Analytics for most routine monitoring, and move to Boards when you need a report it does not provide.

[1](https://docs.sarvam.ai/conversations/monitor/overview#check-production-health)

### Check production health

Open [Agent Analytics](https://docs.sarvam.ai/conversations/monitor/agent-analytics). Start on Overview, then move to Connectivity or Engagement depending on whether the issue is with dialing or conversation quality.

[2](https://docs.sarvam.ai/conversations/monitor/overview#investigate-a-single-call)

### Investigate a single call

Open [Call Logs](https://docs.sarvam.ai/conversations/monitor/agent-analytics/call-logs), select the call, then use [Log Analyser](https://docs.sarvam.ai/conversations/monitor/agent-analytics/log-analyser) on the turn that failed.

[3](https://docs.sarvam.ai/conversations/monitor/overview#build-a-custom-report)

### Build a custom report

Use [Boards](https://docs.sarvam.ai/conversations/monitor/boards) to write SQL, or describe the question and let AI draft the query.

For SQL dialect guidance, schema browsing, and AI query generation, see [SQL best practices](https://docs.sarvam.ai/conversations/monitor/clickhouse-sql-best-practices).

## Where to go next

[

Agent Analytics

Connect rates, engagement, call logs, and turn-level debugging, out of the box.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics)[

Boards

Build your own dashboards with SQL, charts, and reusable filters.







](https://docs.sarvam.ai/conversations/monitor/boards)
