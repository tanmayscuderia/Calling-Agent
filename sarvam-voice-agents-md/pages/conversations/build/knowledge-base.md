# Knowledge Base

Source: https://docs.sarvam.ai/conversations/build/knowledge-base

Give an agent domain knowledge so it answers from your content instead of guessing. A knowledge base (KB) is a named, described group of files the agent can search mid-conversation.

## What a knowledge base is

-   A **knowledge base** is a **named** group of **files** with a **description**.
-   The **description is what the agent reads to decide when to search this KB**, so write it well.
-   Files are part of a KB (added when you create or edit the KB). Supported formats: **PDF, DOCX/DOC, CSV/TSV, TXT, MD**.

## Creating a knowledge base

1.  Open the **Knowledge base** section in your workspace.
2.  Create a KB with a **name**, a **description**, and one or more **files**.
3.  Wait for processing to finish (ingestion is asynchronous) before attaching it to an agent.

You can edit a KB’s files or description at any time; changes apply wherever the KB is used.

## Attaching a KB to an agent

Attach a KB from the agent’s [Settings](https://docs.sarvam.ai/conversations/build/conversation-settings#knowledge-bases). Doing so **automatically adds the KB query tool** to the agent, you don’t add the tool by hand. On the query tool you can then add or remove KBs, or create a new KB inline.

## How retrieval works

When the agent needs a fact, it calls the query tool with two parameters:

-   **knowledge\_base**: which KB to search (the agent picks based on each KB’s description).
-   **query**: a cleaned, self-contained search query.

The platform embeds the query, searches the KB, reranks, and returns the **top chunks** (about 500 tokens) for the agent to answer from. Each chunk is tagged with its **source file** for attribution. This single-stage chunk retrieval keeps latency low.

## Editing the tool’s descriptions

The query tool ships with sensible default descriptions (the tool description and both parameter descriptions), all editable in the [Tools](https://docs.sarvam.ai/conversations/build/tools) UI. Most authors just write clear **KB names and descriptions**, which flow into the tool automatically, and leave the defaults alone.

Good descriptions are what keep retrieval accurate: they tell the model when to search a KB (reference content) and when not to (personal account data, greetings, unrelated requests).

## Managing knowledge bases

-   **Workspace KB library**: create, edit, and delete KBs. A KB attached to a live agent can’t be deleted, you’ll see which agents use it.
-   **Removing vs deleting**: removing a KB from a query tool detaches it from that agent but keeps it in the library; deleting removes it from the library entirely (blocked while it’s attached to a live agent).
-   **Storage**: KB storage is tier-based, with a usage indicator. Over-quota uploads are blocked with a clear message and upgrade path.

## Writing good knowledge bases

-   **Lead with the description.** It’s what the model routes on, make it specific about what’s inside.
-   **Keep a KB coherent.** If files are too varied to describe in one line, split them into separate, more focused KBs, they route better.
-   **Prefer reference content.** KBs are for policies, pricing, product details, and FAQs, not personal account data.
