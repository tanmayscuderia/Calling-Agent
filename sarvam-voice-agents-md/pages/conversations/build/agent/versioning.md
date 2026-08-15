# Agent versioning

Source: https://docs.sarvam.ai/conversations/build/agent/versioning

Agent configuration is versioned. You can change an agent, test the new version, and deploy it deliberately, without disrupting the version that is live.

## Versions at a glance

-   **Draft**: your in-progress edits, not yet live.
-   **Committed**: a saved version you can test and deploy.
-   **Deployed**: the version currently serving live conversations.

## Committing and deploying

Save a new version, test it in test agent, then deploy it intentionally from a tested version rather than hot-swapping a live agent.

## Rolling back

Roll back to a previous committed version if a deploy misbehaves.

## Things to be careful about

-   Don’t deploy an untested version to production.
-   Avoid editing a live agent without committing and testing first.

See also [Navigating the build interface](https://docs.sarvam.ai/conversations/build/navigating-workspace) for where these controls live in the workspace.
