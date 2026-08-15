# Filters

Source: https://docs.sarvam.ai/conversations/monitor/boards/filters

Filters let operators change a board’s scope without editing SQL. Use them for values that should be reusable across widgets, such as dates, agents, and campaigns. You configure filters from a board under **Monitor → Boards**.

## How filters work

When you write a token such as `{{agent_id}}` in a query, the board creates a matching filter chip. Operators change the chip, and every widget that references the token re-runs.

There is no separate **Create filter** button: the token in your SQL is what creates the filter.

## Add a filter from SQL

[1](https://docs.sarvam.ai/conversations/monitor/boards/filters#reference-a-token-in-your-query)

### Reference a token in your query

For example, `{{start_date}}`, `{{end_date}}`, or `{{agent_id}}`.

[2](https://docs.sarvam.ai/conversations/monitor/boards/filters#save-the-widget)

### Save the widget

The board materializes filters for those tokens.

[3](https://docs.sarvam.ai/conversations/monitor/boards/filters#chips-appear)

### Chips appear

The chips appear on the board and in the widget editor. Insert existing ones from the filter menu, or type `{{` for autocomplete.

```sql
SELECT
  toDate(start_datetime) AS day,
  count() AS calls
FROM conversations
WHERE start_datetime >= {{start_date}}
  AND agent_id = {{agent_id}}
GROUP BY day
ORDER BY day
```

Table and column names come from your organization’s live **Schema** browser. Confirm them there, as the examples in these docs are illustrative.

## Configure a filter

[1](https://docs.sarvam.ai/conversations/monitor/boards/filters#open-configure-filters)

### Open Configure Filters

On the board, click **Filters**, or **Configure** next to the chips in the editor.

[2](https://docs.sarvam.ai/conversations/monitor/boards/filters#select-the-filter)

### Select the filter

Pick the token you want to edit.

[3](https://docs.sarvam.ai/conversations/monitor/boards/filters#set-label-type-and-default)

### Set label, type, and default

-   **Display Label**: what operators see on the chip
-   **Internal Name**: the `{{token}}` (read-only)
-   **Data Type**: String, Number, Date, or Dropdown
-   **Default Value**: a default value, or dropdown options as label/value pairs

[4](https://docs.sarvam.ai/conversations/monitor/boards/filters#save)

### Save

A toast confirms **Filter configuration saved**.

Deleting a filter does not rewrite your SQL. Update any widgets that still reference the old `{{token}}`.

## How operators use chips

| Type | Interaction |
| --- | --- |
| **String** | Type a value |
| **Number** | Enter a number |
| **Date** | Pick a date and time |
| **Dropdown** | Choose from the options you configured |

Clear a chip with the × control to omit that value from the next run.

## Set default values

Default values control what operators see the first time they open the board.

[1](https://docs.sarvam.ai/conversations/monitor/boards/filters#open-configure-filters-1)

### Open Configure Filters

Select the filter.

[2](https://docs.sarvam.ai/conversations/monitor/boards/filters#set-default-value)

### Set Default Value

For example, the start of today for `{{start_date}}`.

[3](https://docs.sarvam.ai/conversations/monitor/boards/filters#save-1)

### Save

Defaults seed the board on load. A value the operator already chose in the session takes precedence over the default.

Set a default for every required filter so the board shows data as soon as it opens, before anyone changes a chip.

## Next

[

Create a widget

Use filters inside a saved query.







](https://docs.sarvam.ai/conversations/monitor/boards/create-widget)[

SQL best practices

Keep queries operator-safe and reliable.







](https://docs.sarvam.ai/conversations/monitor/clickhouse-sql-best-practices)
