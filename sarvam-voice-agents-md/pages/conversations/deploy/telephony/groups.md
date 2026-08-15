# Groups

Source: https://docs.sarvam.ai/conversations/deploy/telephony/groups

Groups let you bundle phone numbers together so you can assign and rotate them as a set instead of picking numbers one by one.

The hierarchy is **Connection → Numbers → Group**: every number belongs to a connection, and a group sits on top of that. A single group can hold numbers from more than one connection — for example, some from your Exotel connection and some from a Rent from Sarvam connection. You manage groups from **Deploy → Phone Numbers**.

## Why use groups?

###### Simpler assignment

Assign a group to an agent or campaign instead of selecting individual numbers every time.

###### Better number health

Outbound campaigns cycle through numbers in a group, spreading call volume so no single number gets flagged or blocked.

###### Regional routing

Create groups by region (e.g. `Mumbai`, `Delhi`, `Bangalore`) so callers see a local number.

###### Easy rotation

If a number gets flagged or underperforms, swap it out of the group without touching any agent or campaign config.

## Create a group

[1](https://docs.sarvam.ai/conversations/deploy/telephony/groups#select-a-connection)

### Select a connection

In **Deploy → Phone Numbers**, select your connection, then click **Create Group**.

[2](https://docs.sarvam.ai/conversations/deploy/telephony/groups#name-the-group)

### Name the group

Give it a descriptive name, e.g. `Sample Sales`, `Mumbai Outbound`, or `Hindi Support`.

[3](https://docs.sarvam.ai/conversations/deploy/telephony/groups#add-numbers)

### Add numbers

Add the phone numbers you want in the group.

[4](https://docs.sarvam.ai/conversations/deploy/telephony/groups#create-the-group)

### Create the group

Create the group. Once it’s created, you can add or remove numbers at any time.

## Use a group

Once created, use a group anywhere you’d normally pick individual numbers:

| Where | How |
| --- | --- |
| **Agent assignment** | Select the group instead of a single number; inbound calls distribute across the group’s numbers |
| **Outbound campaigns** | Select the group as the dial-from source; the campaign cycles through numbers automatically |

## Manage a group

###### Add numbers

###### Remove numbers

###### Rename

###### Delete

Open the group and add more numbers at any time. New numbers are immediately available for the agents and campaigns using this group.

A number can belong to multiple groups. Adding it to one group doesn’t remove it from another.

## Best practices

[1](https://docs.sarvam.ai/conversations/deploy/telephony/groups#name-groups-by-purpose)

### Name groups by purpose

`Mumbai Outbound` is better than `Group 1`. Your team will thank you when there are ten groups.

[2](https://docs.sarvam.ai/conversations/deploy/telephony/groups#monitor-number-health)

### Monitor number health

Use [Connectivity → Phone Number Health](https://docs.sarvam.ai/conversations/monitor/agent-analytics/connectivity) to spot underperforming numbers, then rotate them out of the group.

[3](https://docs.sarvam.ai/conversations/deploy/telephony/groups#dont-put-all-numbers-in-one-group)

### Don't put all numbers in one group

Separate by region or campaign purpose. If one campaign’s numbers get flagged, it won’t affect the others.

## Next

[

Campaigns

Use groups to launch outbound campaigns with automatic number rotation.







](https://docs.sarvam.ai/conversations/deploy/campaigns)[

Manage Phone Numbers

Add, assign, release, and archive individual numbers.







](https://docs.sarvam.ai/conversations/deploy/telephony/manage-numbers)
