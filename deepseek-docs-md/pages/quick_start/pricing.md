# Models & Pricing

Source: https://api-docs.deepseek.com/quick_start/pricing

The prices listed below are in units of per 1M tokens. A token, the smallest unit of text that the model recognizes, can be a word, a number, or even a punctuation mark. We will bill based on the total number of input and output tokens by the model.

* * *

## Model Details[​](https://api-docs.deepseek.com/quick_start/pricing#model-details "Direct link to Model Details")

**

<table style="text-align:center"><tbody><tr><td colspan="2" style="text-align:center">MODEL</td><td>deepseek-v4-flash<sup>(1)</sup></td><td>deepseek-v4-pro</td></tr><tr><td colspan="2">BASE URL (OpenAI Format)</td><td colspan="2"><a href="https://api.deepseek.com/" target="_blank" rel="noopener noreferrer">https://api.deepseek.com</a></td></tr><tr><td colspan="2">BASE URL (Anthropic Format)</td><td colspan="2"><a href="https://api.deepseek.com/anthropic" target="_blank" rel="noopener noreferrer">https://api.deepseek.com/anthropic</a></td></tr><tr><td colspan="2" style="text-align:center">MODEL VERSION</td><td>DeepSeek-V4-Flash</td><td>DeepSeek-V4-Pro</td></tr><tr><td colspan="2">THINKING MODE</td><td colspan="2">Supports both non-thinking and thinking (default) modes<br>See <a href="https://api-docs.deepseek.com/guides/thinking_mode">Thinking Mode</a> for how to switch</td></tr><tr><td colspan="2">CONTEXT LENGTH</td><td colspan="2">1M</td></tr><tr><td colspan="2">MAX OUTPUT</td><td colspan="2">MAXIMUM: 384K</td></tr><tr><td rowspan="4">FEATURES</td><td><a href="https://api-docs.deepseek.com/guides/json_mode">Json Output</a></td><td>✓</td><td>✓</td></tr><tr><td><a href="https://api-docs.deepseek.com/guides/tool_calls">Tool Calls</a></td><td>✓</td><td>✓</td></tr><tr><td><a href="https://api-docs.deepseek.com/guides/chat_prefix_completion">Chat Prefix Completion（Beta）</a></td><td>✓</td><td>✓</td></tr><tr><td><a href="https://api-docs.deepseek.com/guides/fim_completion">FIM Completion（Beta）</a></td><td>Non-thinking mode only</td><td>Non-thinking mode only</td></tr><tr><td rowspan="3">PRICING</td><td>1M INPUT TOKENS (CACHE HIT)</td><td>$0.0028</td><td>$0.003625</td></tr><tr><td>1M INPUT TOKENS (CACHE MISS)</td><td>$0.14</td><td>$0.435</td></tr><tr><td>1M OUTPUT TOKENS</td><td>$0.28</td><td>$0.87</td></tr><tr><td colspan="2">Concurrency Limit<sup>(2)</sup></td><td>2500</td><td>500</td></tr></tbody></table>

**

(1) The model names `deepseek-chat` and `deepseek-reasoner` will be deprecated on 2026/07/24 15:59 UTC. For compatibility, they correspond to the non-thinking mode and thinking mode of `deepseek-v4-flash`, respectively.  
(2) For more details on concurrency limits, please refer to [Rate Limit & Isolation](https://api-docs.deepseek.com/quick_start/rate_limit)

* * *

## Deduction Rules[​](https://api-docs.deepseek.com/quick_start/pricing#deduction-rules "Direct link to Deduction Rules")

The expense = number of tokens × price. The corresponding fees will be directly deducted from your topped-up balance or granted balance, with a preference for using the granted balance first when both balances are available.

Product prices may vary and DeepSeek reserves the right to adjust them. We recommend topping up based on your actual usage and regularly checking this page for the most recent pricing information.
