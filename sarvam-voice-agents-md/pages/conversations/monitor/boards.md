# Boards

Source: https://docs.sarvam.ai/conversations/monitor/boards

Boards are custom dashboards for reporting questions that [Agent Analytics](https://docs.sarvam.ai/conversations/monitor/agent-analytics) does not answer out of the box. You write SQL (or describe the query in plain language), chart the result, and share a board that your team can filter without editing the underlying query.

Boards live under **Monitor → Boards**.

Boards are an enterprise offering.

![A board with filter chips and widgets for daily calls, a KPI number, and calls by language.](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/sarvam-api-docs.docs.buildwithfern.com/3a77144e44630ceeea97e6a51eb624faf91da5d343593ef6d528e492e7fc34eb/voice-agents/images/boards-overview.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260815%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260815T091911Z&X-Amz-Expires=604800&X-Amz-Signature=a3d8a4fff9717c723e905145da7669de2bcc7314c3a84884bace6307c528e72a&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Boards

## Build your first board

[1](https://docs.sarvam.ai/conversations/monitor/boards#create-the-board)

### Create the board

Name it something your team will recognize, for example `Campaign Overview`. See [Create a board](https://docs.sarvam.ai/conversations/monitor/boards/create-board).

[2](https://docs.sarvam.ai/conversations/monitor/boards#add-a-widget)

### Add a widget

Write SQL or press `/` to generate it with AI, run the query, choose a Table, Number, Bar, or Line visualization, and save. See [Create a widget](https://docs.sarvam.ai/conversations/monitor/boards/create-widget).

[3](https://docs.sarvam.ai/conversations/monitor/boards#parameterize-with-filters)

### Parameterize with filters

Add tokens such as `{{start_date}}` or `{{agent_id}}` to the query, then set default values so the board shows data as soon as it opens. See [Filters](https://docs.sarvam.ai/conversations/monitor/boards/filters).

## What’s on a board

| Piece | Role |
| --- | --- |
| **Tabs** | Group widgets into pages (**Create → Tab**) |
| **Widgets** | One query and one visualization, which you can drag and resize on the grid |
| **Filters** | Board-level `{{tokens}}` that operators can change without editing SQL |
| **Alerts** | Optional notifications when a saved widget returns results on a schedule |

## Boards vs Agent Analytics

| Use | When |
| --- | --- |
| [Agent Analytics](https://docs.sarvam.ai/conversations/monitor/agent-analytics) | You need standard connect, engagement, and call-level investigation, which is already built |
| **Boards** | You need a custom metric, a stakeholder view, or a chart that is not on the fixed tabs |

Every widget is powered by a SQL query. For dialect guidance, schema browsing, guardrails, and AI generation, see [SQL best practices](https://docs.sarvam.ai/conversations/monitor/clickhouse-sql-best-practices).

## Next

[

Create a board

Set up the board name, tabs, layout, and board actions.







](https://docs.sarvam.ai/conversations/monitor/boards/create-board)[

Create a widget

Write a query, run it, choose a visualization, and save.







](https://docs.sarvam.ai/conversations/monitor/boards/create-widget)[

Filters

Parameterize boards with `{{tokens}}`, types, chips, and defaults.







](https://docs.sarvam.ai/conversations/monitor/boards/filters)[

SQL best practices

Write safer queries and use AI generation effectively.







](https://docs.sarvam.ai/conversations/monitor/clickhouse-sql-best-practices)
