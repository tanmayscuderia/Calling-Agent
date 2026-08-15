# SQL best practices

Source: https://docs.sarvam.ai/conversations/monitor/clickhouse-sql-best-practices

Boards are built from widgets, and each widget is powered by a SQL query. The SQL dialect here is column-oriented and tuned for fast aggregations over large call datasets, so some of its functions and conventions differ from standard PostgreSQL or MySQL and may be new to you.

This page explains how to write and review the SQL behind a widget: where to write it, how to confirm the schema for your organization, which patterns to use, and how to generate a draft query with AI. For the surrounding UI flow, start at [Boards](https://docs.sarvam.ai/conversations/monitor/boards) and [Create a widget](https://docs.sarvam.ai/conversations/monitor/boards/create-widget).

## The SQL editor

You write and run widget queries in the SQL editor. The following actions are available while editing:

| Action | How |
| --- | --- |
| **Run** | Click **Run** or press ⌘/Ctrl+Enter |
| **Schema** | Browse the live databases, tables, and column types for your organization |
| **Generate with AI** | Press `/` or click **Generate with AI** |
| **Insert filter** | Use the filter menu, or type `{{filter_name}}` directly |
| **Beautify** | Format the SQL with standard keyword casing |
| **Copy** | Copy the query to share or version it elsewhere |

## Browse the schema

Before writing a query, open **Schema** to see the databases, tables, and column types available to your organization. Table and column names vary between organizations, so confirm them here rather than assuming names from documentation or from an AI suggestion. Using the exact names from **Schema** is the most common way to avoid a query that fails to run or returns no rows.

## Read-only access

The editor allows read-style queries only. The following statements are blocked and underlined in the editor, and will not run:

`DELETE` · `DROP` · `TRUNCATE` · `ALTER` · `INSERT` · `UPDATE`

Write your widgets with `SELECT`. Common table expressions (CTEs) and subqueries are supported as long as they only read data.

## Write efficient queries

Queries are fastest when you filter early and aggregate in the database rather than returning raw rows to the widget. The following steps produce queries that stay fast and map cleanly onto a chart.

[1](https://docs.sarvam.ai/conversations/monitor/clickhouse-sql-best-practices#confirm-the-schema)

### Confirm the schema

Open **Schema** and use the exact table and column names for your organization. Do not invent names from documentation or from an AI draft.

[2](https://docs.sarvam.ai/conversations/monitor/clickhouse-sql-best-practices#filter-early)

### Filter early

Push time and entity filters into the `WHERE` clause, ideally through board filter tokens so the widget stays reusable:

```
WHERE start_datetime >= {{start_date}}
  AND start_datetime < {{end_date}}
  AND agent_id = {{agent_id}}
```

[3](https://docs.sarvam.ai/conversations/monitor/clickhouse-sql-best-practices#aggregate-for-charts)

### Aggregate for charts

Return rollups rather than raw rows. Aggregating in the database keeps result sets small and charts responsive:

```sql
SELECT
  toDate(start_datetime) AS day,
  count() AS calls,
  countIf(connectivity_status = 'connected') AS connected
FROM conversations
WHERE start_datetime >= {{start_date}}
GROUP BY day
ORDER BY day
```

[4](https://docs.sarvam.ai/conversations/monitor/clickhouse-sql-best-practices#match-the-result-to-the-visualization)

### Match the result to the visualization

Shape the output to fit the widget type:

-   **Number** — one row with one numeric column
-   **Bar / Line** — a category or time value on the X axis, a measure on the Y axis
-   **Table** — an intentional set of columns, not `SELECT *`

Frequently used patterns include `toDate(...)` and `toStartOfHour(...)` for time bucketing, `countIf(condition)` and `avgIf(column, condition)` for conditional aggregation, and `ORDER BY ... DESC LIMIT 20` to return only the top results.

## Generate SQL with AI

If you are new to this SQL dialect, you can describe the question in plain language and let **Generate with AI** produce a draft query for you to review.

[1](https://docs.sarvam.ai/conversations/monitor/clickhouse-sql-best-practices#open-ai-assist)

### Open AI assist

Press `/` or click **Generate with AI**.

[2](https://docs.sarvam.ai/conversations/monitor/clickhouse-sql-best-practices#describe-the-question)

### Describe the question

State the metric in plain language, for example: average handle time per agent for the last 7 days.

[3](https://docs.sarvam.ai/conversations/monitor/clickhouse-sql-best-practices#generate-the-draft)

### Generate the draft

While the draft is being written, the editor shows **Writing your query…**. You can click **Stop** to cancel.

[4](https://docs.sarvam.ai/conversations/monitor/clickhouse-sql-best-practices#review-then-accept)

### Review, then accept

Toggle **Diff** to compare the current query with the AI suggestion. Refine the prompt and **Regenerate**, or click **Accept** to keep the query and run it.

Treat AI output as a starting point and confirm it before saving.

###### What AI is good for

-   First drafts of aggregations and time series
-   Rewrites after you change the question
-   Helping teammates who are new to the SQL syntax

###### What you must still verify

-   Table and column names against **Schema**
-   Filter tokens (`{{filters}}`) for reusable boards
-   Metric definitions (connected vs. attempted vs. engaged)
-   Read-only access — blocked statements will not run
-   Spot-checks against [Agent Analytics](https://docs.sarvam.ai/conversations/monitor/agent-analytics) when the metric overlaps

## Before you save

Confirm each of the following before saving a widget query:

1.  The query is `SELECT`\-only and contains no blocked statements.
2.  Time and entity filters use board filter tokens where you need control over operators.
3.  The result shape matches the widget type (Table, Number, Bar, or Line).
4.  Table and column names match the schema for your organization.
5.  Filter defaults are set so the board is not empty on first open. See [Filters](https://docs.sarvam.ai/conversations/monitor/boards/filters).
6.  The widget title describes the metric in plain language.

## Next

[

Create a widget

Put your query on a board and choose a visualization.







](https://docs.sarvam.ai/conversations/monitor/boards/create-widget)[

Filters

Parameterize queries with `{{tokens}}` and set defaults.







](https://docs.sarvam.ai/conversations/monitor/boards/filters)[

Boards

Understand the board layout and how widgets fit together.







](https://docs.sarvam.ai/conversations/monitor/boards)[

Agent Analytics

Cross-check widget metrics against prebuilt analytics.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics)
