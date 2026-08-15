# Quickstart

Source: https://docs.sarvam.ai/conversations/quickstart

Create a voice agent, test it in test agent, deploy it to a phone number, and make your first call.

## Start building

You create and manage agents on the **Agents** page (under **Build**). Two ways to start a new one:

-   **Describe what your agent should do** in the prompt box, this starts a new [Genie](https://docs.sarvam.ai/conversations/build/genie) session that builds the agent for you.
-   **Create from Scratch** for a blank agent.

You can also reopen a recent agent to keep working.

[

Open Agents

Describe an agent for Genie to build, or create one from scratch.







](https://indus.sarvam.ai/samvaad/build/my-agents)

## Step 1: Create an agent

1.  Log in at [indus.sarvam.ai](https://indus.sarvam.ai/) and open **Agents** under **Build**.
2.  Either **describe what your agent should do** in the prompt box (this starts a [Genie](https://docs.sarvam.ai/conversations/build/genie) session that drafts the agent) or click **Create from Scratch** for a blank agent.
3.  You land on the **Canvas**, the visual agent builder where you configure everything.

From here, keep refining with Genie or write the prompt yourself. The steps below use the prompt-writing approach.

![The Agents page with the prompt "What should your agent do?", a Create from Scratch button, and a Recents table of agents.](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/sarvam-api-docs.docs.buildwithfern.com/ece72fc4f618a55a0b8a4f72e3cb3acc4afcbf50e9b2008e44c472b18f64105b/voice-agents/images/agents-page.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260815%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260815T091906Z&X-Amz-Expires=604800&X-Amz-Signature=f8d539d714820daf8df27558e60677704c6e120ba842cdaa8b73c562c55a42fe&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

The Agents page: describe what your agent should do for Genie, or Create from Scratch.

## Step 2: Configure a system prompt and initial message

1.  On the Canvas, open the agent’s **Instructions** tab.
2.  Set the **Greeting** (initial message) the agent speaks when the conversation starts. Insert variables as chips (for example `{} developer_name`).
3.  Write the **system prompt**: who the agent is, what it should accomplish, and how it should behave.
4.  Keep the first prompt short; you can refine it later in the [Instruction](https://docs.sarvam.ai/conversations/build/system-prompt) guide.

![The agent Instructions editor showing a Greeting with a developer\_name variable chip and a system prompt, with the Genie panel open on the right.](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/sarvam-api-docs.docs.buildwithfern.com/17d737d0bdd99d14bc559b7a06d233830a651b935d35fcbd37ade488ba3103cb/voice-agents/images/system-prompt-initial-message.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260815%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260815T091906Z&X-Amz-Expires=604800&X-Amz-Signature=8ba39fc7140aa1cec7cb488a64a5a3a800ae4092fee2c9397c9015d5ebe0ce2b&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Instructions on the Canvas: Greeting (initial message) and system prompt, with Genie open on the right.

## Step 3: Select language and voice

1.  Open **Settings** in the agent.
2.  Under **Language personalisation**, set the **starting language**, turn on **Switch language during call** if needed, and choose the **languages allowed**.
3.  Configure voice under [Speakers & voice](https://docs.sarvam.ai/conversations/build/voice-language).

See [Conversation settings → Language personalisation](https://docs.sarvam.ai/conversations/build/conversation-settings#language-personalisation) for the full set of language controls.

![Agent Settings showing Language personalisation with Switch language during call on, English and Hindi selected, and Starting language set to English.](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/sarvam-api-docs.docs.buildwithfern.com/c3c14581104b782bb215584eb908950370c9223826ff376dfad99ac77fb2453c/voice-agents/images/settings-language.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260815%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260815T091906Z&X-Amz-Expires=604800&X-Amz-Signature=acea080c8c0e0c9285e49367a144d897f0ebe9d0af8fde031d8124c26a9a9b35&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Settings → Language personalisation: starting language, switch during call, and languages allowed.

## Step 4: Test in test agent

1.  Open **test agent** and speak to your agent normally.
2.  Test how it handles the conversation: greeting, turn-taking, language, and flow.
3.  Once you’re satisfied, move on to the next step.

See [Deploy](https://docs.sarvam.ai/conversations/deploy/overview) for phone-number-based testing options.

![The test agent panel with a conversation transcript showing the agent's initial greeting and a follow-up, next to language and settings controls.](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/sarvam-api-docs.docs.buildwithfern.com/3c0a1e178d2ad0d16f9ec9a0f823a8a38255efe945cdda2d18633078c4e115d3/voice-agents/images/playground.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260815%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260815T091906Z&X-Amz-Expires=604800&X-Amz-Signature=52f61fced47e47c267ffc49c49266dded0841b856617c664b6be7b75a8ca7a55&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

test agent: chat with the agent and confirm the greeting and flow before deploying.

## Step 5: Deploy to a phone number

1.  Go to **Phone Numbers** in the **Deploy** section.
2.  Get a phone number one of two ways:
    -   **Bring your own telephony**: connect your existing provider and import your numbers. See [Bring Your Own Telephony](https://docs.sarvam.ai/conversations/deploy/telephony/bring-your-own).
    -   **Rent from Sarvam**: get a number through Sarvam’s Vobiz managed partner account. See [Rent from Sarvam](https://docs.sarvam.ai/conversations/deploy/telephony/rent-from-sarvam).
3.  Assign the number to your agent for inbound calls.

See [Phone Numbers](https://docs.sarvam.ai/conversations/deploy/telephony) for provider-specific setup.

![The Phone Numbers page for a Sarvam Vobiz connection, showing Total/Active/Archived counts and a table of phone numbers with status.](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/sarvam-api-docs.docs.buildwithfern.com/12ebc68866612aadd1853a14b6eace22cab0463f459ae1544d0ce6b4e5c6b8b4/voice-agents/images/telephony-phone-numbers.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260815%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260815T091906Z&X-Amz-Expires=604800&X-Amz-Signature=ed9e8e0ecc004d5972a719b81b9a6cf9e0d5c5ccbd4dfa5019444decf5b6355e&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Phone Numbers: connections, number list, and Buy number.

## Step 6: Make your first call

Make a call one of two ways:

-   **Outbound**: in **Outbound Campaigns**, configure a campaign from your agent to a cohort of contacts. See [Campaigns](https://docs.sarvam.ai/conversations/deploy/campaigns).
-   **Inbound**: deploy the agent under **Inbound Calls**, then call the agent’s number from any phone.

Then open **Monitor → Agent Analytics** to review the call, transcript, and recording.

![Unified View Details panel open on the Transcript tab, showing the agent and caller conversation with an audio player at the bottom.](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/sarvam-api-docs.docs.buildwithfern.com/1de6cb724d0e15dbd4f40811695c0c1ca169278a803be62756dfc8b9b74bbe29/voice-agents/images/agent-analytics-call-detail.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260815%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260815T091906Z&X-Amz-Expires=604800&X-Amz-Signature=51d6cfdac56ae336da22630b38315a6126019b3fa58ea45edb7e7c3d2045a1ed&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Agent Analytics call detail: transcript and recording for a completed call.

Next: explore the full [Build](https://docs.sarvam.ai/conversations/build/overview) section to add tools, knowledge, states, and evaluation criteria.
