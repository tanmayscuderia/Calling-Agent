# Cohorts

Source: https://docs.sarvam.ai/conversations/deploy/campaigns/cohorts

A cohort is a batch of contacts within a campaign. Every campaign starts with one cohort (your initial upload), and you can add more at any time from the list row action or the [campaign detail page](https://docs.sarvam.ai/conversations/deploy/campaigns/campaign-details).

Each cohort is validated on upload, splitting into **valid records** (contacts that will be dialed) and **invalid records** (rows with bad phone numbers or missing required fields).

## When to use multiple cohorts

###### Phased rollout

Start with 50–100 contacts to validate call quality and connect rates. Add the full list as a second cohort once it looks good.

###### Segmented audiences

Upload different audience segments as separate cohorts — each with its own column structure and variable mappings.

###### Incremental additions

New leads came in? Add them as a new cohort instead of re-uploading the entire list.

## Add a cohort

[1](https://docs.sarvam.ai/conversations/deploy/campaigns/cohorts#open-the-campaign)

### Open the campaign

Go to **Deploy → Campaigns** and open the campaign, then click **Add cohort** — from the **Cohorts** section on a running campaign, or from the **Actions** menu.

[2](https://docs.sarvam.ai/conversations/deploy/campaigns/cohorts#upload-and-name)

### Upload and name

Upload a new CSV (up to 100 MB) and give the cohort a name. Download the sample if you need the format. Cohorts can have different columns as long as the required variables are mapped.

[3](https://docs.sarvam.ai/conversations/deploy/campaigns/cohorts#upload-the-cohort)

### Upload the cohort

Save to validate the file and queue the contacts.

Adding a cohort to an **active** campaign queues the new contacts to dial within the current schedule.

## Where to go next

[

Campaign details

See each cohort’s valid and invalid records.







](https://docs.sarvam.ai/conversations/deploy/campaigns/campaign-details)[

Variables & personalization

Map CSV columns to the variables your agent uses on each call.







](https://docs.sarvam.ai/conversations/build/variables-personalization)
