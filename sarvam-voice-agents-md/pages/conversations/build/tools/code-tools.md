# Code Tools

Source: https://docs.sarvam.ai/conversations/build/tools/code-tools

Upload a custom Python file (for example, `tools.py`) to define custom functions and tools that go beyond the standard [API](https://docs.sarvam.ai/conversations/build/tools/https-tool) and [data](https://docs.sarvam.ai/conversations/build/tools/data-validation) tools.

The Python file you upload needs to be built using the [Sarvam Conv AI SDK](https://pypi.org/project/sarvam-conv-ai-sdk/).

This is an enterprise only feature. [Contact us](https://www.sarvam.ai/contact-us) to get access to it.

## Access Code Tools

[1](https://docs.sarvam.ai/conversations/build/tools/code-tools#open-tools)

### Open Tools

In the update-agent screen, click **Tools** in the left sidebar.

![The agent editor left sidebar with Instructions, Variables, Tools, Settings, and Tests, with Tools selected.](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/sarvam-api-docs.docs.buildwithfern.com/8710c791adee016847f9ccb77863897bf8204e6373893fa4efc8bf4d02ad8bfe/voice-agents/images/code-tools-sidebar.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260815%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260815T091909Z&X-Amz-Expires=604800&X-Amz-Signature=3dffd849e8f9b6dcf174a7e524a4d2aac0d32f6e3ab325a6d18c0e1284595252&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Click on Tools in the left sidebar, and then click on Add tool.

[2](https://docs.sarvam.ai/conversations/build/tools/code-tools#add-a-tool)

### Add a tool

Click **Add tool**.

![The Add a tool dialog with API Tool, Data Validator, Data Verifier, Mock API, and Upload Python file options.](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/sarvam-api-docs.docs.buildwithfern.com/6611061b1db0bb633bb37ce51ca58c8195438afa9e7a0621df87bf72912a87a0/voice-agents/images/code-tools-add-tool.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260815%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260815T091909Z&X-Amz-Expires=604800&X-Amz-Signature=7e2b885d258cbf45b827505f99679281f655478664ce8d77e18c381e648cebce&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Click on "Upload Python file".

[3](https://docs.sarvam.ai/conversations/build/tools/code-tools#click-upload-python-file)

### Click "Upload Python file"

Choose **Upload Python file**, then drag & drop your `.py` file or select it from disk.

![The Upload Python Tool dialog with a drag-and-drop area accepting .py files.](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/sarvam-api-docs.docs.buildwithfern.com/98eaa41086fa890ad13a44faadbc9424f0a111739e109a06da7751aaed5aa14e/voice-agents/images/code-tools-upload.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260815%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260815T091909Z&X-Amz-Expires=604800&X-Amz-Signature=22a84a47d179fd72e80d48d8848e027c7e29489ca1cfdda7a88b5355cfc54065&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Upload your Python file.

## When to use a code tool

An HTTP tool makes one request and hands the response back to the agent. That covers most lookups.

A code tool runs your Python inside the call, with access to a context object that holds the live interaction. It can call several services, decide what to do with what comes back, and change how the rest of the conversation goes.

Reach for a code tool when the work is more than one request, or when the tool needs to affect the conversation itself.

### Example: order status with a fallback

The agent needs to answer “where is my order”. The order service holds the order, a separate courier service holds the tracking. The tool calls both, and still answers usefully if the courier is down.

```python
import httpx
from datetime import datetime
from pydantic import Field

from sarvam_conv_ai_sdk import SarvamTool, SarvamToolContext, SarvamToolOutput


class GetOrderStatus(SarvamTool):
    """Look up an order and its current delivery status by order ID."""

    pre_run_message: str = Field(
        default="Let me check that for you.",
        description="Message shown to the user before the tool runs",
    )
    order_id: str = Field(description="The order ID the user gave, such as ORD12345")

    async def run(self, context: SarvamToolContext) -> SarvamToolOutput:
        api_key = context.get_secret("ORDERS_API_KEY")

        async with httpx.AsyncClient(timeout=5.0) as client:
            order_response = await client.get(
                f"https://api.example.com/orders/{self.order_id}",
                headers={"Authorization": f"Bearer {api_key}"},
            )

            if order_response.status_code == 404:
                return SarvamToolOutput(
                    message_to_llm=(
                        f"No order found with ID {self.order_id}. "
                        "Ask the user to confirm the ID."
                    ),
                    context=context,
                )

            order = order_response.json()

            # Only call the courier if the order has actually shipped.
            tracking = None
            if order["status"] == "shipped":
                try:
                    tracking_response = await client.get(
                        f"https://api.courier.example.com/track/{order['awb']}"
                    )
                    tracking = tracking_response.json()
                except httpx.HTTPError:
                    tracking = None

        context.set_agent_variable("order_id", self.order_id)

        if tracking:
            eta = datetime.fromisoformat(tracking["eta"])
            return SarvamToolOutput(
                message_to_llm=(
                    f"Order {self.order_id} shipped and is {tracking['location']}. "
                    f"Expected delivery {eta.strftime('%A, %d %B')}. "
                    "Tell the user where it is and when it arrives."
                ),
                context=context,
            )

        return SarvamToolOutput(
            message_to_llm=(
                f"Order {self.order_id} is {order['status']}. "
                "Live tracking is unavailable. Share the status and offer to send an SMS update."
            ),
            context=context,
        )
```

What an HTTP tool could not do here: skip the second call when the order has not shipped, recover from the courier timing out, or collapse two responses into one sentence for the model.
