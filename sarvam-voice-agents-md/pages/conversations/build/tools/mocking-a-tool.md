# Mocking a tool

Source: https://docs.sarvam.ai/conversations/build/tools/mocking-a-tool

Add a **Mock API tool** to test an agent before your real backend exists. It’s a separate tool from the [API tool](https://docs.sarvam.ai/conversations/build/tools/https-tool) and uses Postman Echo (`postman-echo.com`) as its endpoint - whatever payload the agent sends, it gets back unchanged, so you can wire up and test tool calls end to end without a real backend.

You can also just ask [Genie](https://docs.sarvam.ai/conversations/build/genie) to set up the Mock API tool for you.

Use it to rehearse a tool in [test agent](https://docs.sarvam.ai/conversations/build/navigating-workspace#testing-the-agent) before pointing it at your production API. Once you’re happy with the agent, remove the Mock API tool and connect your real endpoint using the [API tool](https://docs.sarvam.ai/conversations/build/tools/https-tool).
