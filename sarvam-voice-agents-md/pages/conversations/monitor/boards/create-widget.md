# Create a widget

Source: https://docs.sarvam.ai/conversations/monitor/boards/create-widget

A widget is a single query paired with a single visualization on a board. Keep each widget narrow and focused on one metric, for example “daily connected calls for this campaign” rather than a broad query covering everything. You add widgets from a board under **Monitor → Boards**.

## Create a widget

[1](https://docs.sarvam.ai/conversations/monitor/boards/create-widget#open-the-editor)

### Open the editor

On a board, click **Create → Widget**, or **Add widget** on an empty tab.

[2](https://docs.sarvam.ai/conversations/monitor/boards/create-widget#name-it)

### Name it

Name the widget after the metric it shows. A blank name saves as `Untitled widget`.

[3](https://docs.sarvam.ai/conversations/monitor/boards/create-widget#write-or-generate-sql)

### Write or generate SQL

Type SQL yourself, or press `/` and use **Generate with AI**. Browse the available tables in the **Schema** panel before referencing column names.

[4](https://docs.sarvam.ai/conversations/monitor/boards/create-widget#run)

### Run

Click **Run** or press ⌘/Ctrl+Enter, and correct any errors until the preview looks right.

[5](https://docs.sarvam.ai/conversations/monitor/boards/create-widget#pick-a-visualization)

### Pick a visualization

Choose **Table**, **123** (number), **Bar**, or **Line**. For bar and line charts, set the **X-axis**, **Y-axis**, and an optional **Series breakout**.

[6](https://docs.sarvam.ai/conversations/monitor/boards/create-widget#save)

### Save

Click **Save widget**, then drag it into place on the board.

## Which chart to pick

| Type | When to use |
| --- | --- |
| **Table** | Inspect rows or multi-column results |
| **Number** | Show a single KPI: one row, one numeric column |
| **Bar** | Compare categories such as languages, agents, or failure reasons |
| **Line** | Show a trend over time |

After the first successful run, the editor suggests the first column as X and the first numeric-looking column as Y. The X and Y axes must use different columns.

## Best practices

###### One question per widget

Keep each widget to a single metric. If you need two metrics, create two widgets.

###### Prefer filters over hardcoded IDs

Use tokens such as `{{agent_id}}` and `{{start_date}}` so operators can change the scope without editing SQL. See [Filters](https://docs.sarvam.ai/conversations/monitor/boards/filters).

###### Review AI-generated SQL before you share

Treat AI output as a first draft. Verify schema names and metric definitions before relying on the widget. See [SQL best practices](https://docs.sarvam.ai/conversations/monitor/clickhouse-sql-best-practices).

## Optional alerts

On a saved widget, open **Configure alerts** to be notified when the widget returns any results. Alerts can run hourly, daily, or weekly, and can be delivered by email and/or a Slack webhook.

## Next

[

Filters

Parameterize the query so operators can change its scope.







](https://docs.sarvam.ai/conversations/monitor/boards/filters)[

SQL best practices

Review dialect, schema, and AI generation guidance.







](https://docs.sarvam.ai/conversations/monitor/clickhouse-sql-best-practices)
