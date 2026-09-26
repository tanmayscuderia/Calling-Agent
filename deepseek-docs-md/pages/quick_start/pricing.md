# Models & Pricing

Source: https://api-docs.deepseek.com/quick_start/pricing

The prices listed below are in units of per 1M tokens. A token, the smallest unit of text that the model recognizes, can be a word, a number, or even a punctuation mark. We will bill based on the total number of input and output tokens by the model.

* * *

## Model Details[​](https://api-docs.deepseek.com/quick_start/pricing#model-details "Direct link to Model Details")

**

<table style="text-align:center"><tbody><tr><td colspan="3" style="text-align:center">MODEL</td><td>deepseek-flash<sup>(1)</sup></td><td>deepseek-v4-pro</td></tr><tr><td colspan="3">BASE URL (OpenAI Format)</td><td colspan="2"><a href="https://api.deepseek.com/" target="_blank" rel="noopener noreferrer">https://api.deepseek.com</a></td></tr><tr><td colspan="3">BASE URL (Anthropic Format)</td><td colspan="2"><a href="https://api.deepseek.com/anthropic" target="_blank" rel="noopener noreferrer">https://api.deepseek.com/anthropic</a></td></tr><tr><td colspan="3" style="text-align:center">MODEL VERSION</td><td>DeepSeek-V4.1-Flash</td><td>DeepSeek-V4-Pro-0813</td></tr><tr><td colspan="3">THINKING MODE</td><td colspan="2">Supports both non-thinking and thinking (default) modes<br>See <a href="https://api-docs.deepseek.com/guides/thinking_mode">Thinking Mode</a> for how to switch</td></tr><tr><td colspan="3">CONTEXT LENGTH</td><td colspan="2">1M</td></tr><tr><td colspan="3">MAX OUTPUT</td><td colspan="2">MAXIMUM: 384K</td></tr><tr><td rowspan="7">FEATURES</td><td colspan="2"><a href="https://api-docs.deepseek.com/guides/json_mode">Json Output</a></td><td>✓</td><td>✓</td></tr><tr><td colspan="2"><a href="https://api-docs.deepseek.com/guides/tool_calls">Tool Calls</a></td><td>✓</td><td>✓</td></tr><tr><td colspan="2"><a href="https://api-docs.deepseek.com/guides/responses_api">Responses API</a></td><td>✓</td><td>✓</td></tr><tr><td colspan="2"><a href="https://api-docs.deepseek.com/guides/anthropic_api">Anthropic API</a></td><td>✓</td><td>✓</td></tr><tr><td colspan="2"><a href="https://api-docs.deepseek.com/guides/chat_prefix_completion">Chat Prefix Completion（Beta）</a></td><td>✓</td><td>✓</td></tr><tr><td colspan="2"><a href="https://api-docs.deepseek.com/guides/fim_completion">FIM Completion（Beta）</a></td><td>Non-thinking mode only</td><td>Non-thinking mode only</td></tr><tr><td colspan="2"><a href="https://api-docs.deepseek.com/guides/vision">Vision</a></td><td>✓</td><td>Not supported</td></tr><tr><td rowspan="6">PRICING<sup>(2)</sup></td><td rowspan="2">1M INPUT TOKENS<br>(CACHE HIT)</td><td>OFF-PEAK</td><td>$0.003</td><td>$0.022</td></tr><tr><td>PEAK</td><td>$0.006</td><td>$0.044</td></tr><tr><td rowspan="2">1M INPUT TOKENS<br>(CACHE MISS)</td><td>OFF-PEAK</td><td>$0.15</td><td>$0.66</td></tr><tr><td>PEAK</td><td>$0.3</td><td>$1.32</td></tr><tr><td rowspan="2">1M OUTPUT TOKENS</td><td>OFF-PEAK</td><td>$0.6</td><td>$1.98</td></tr><tr><td>PEAK</td><td>$1.2</td><td>$3.96</td></tr><tr><td colspan="3">Concurrency Limit<sup>(3)</sup></td><td>2500</td><td>500</td></tr></tbody></table>

**

(1) Use `deepseek-flash` as the model name. The legacy names `deepseek-v4-flash` and `deepseek-v4-flash-vision-exp` are still accepted, but the corresponding models have been retired, their requests are served by the DeepSeek-V4.1-Flash model and billed at the Flash price.

(2) Off-peak rates are half of the peak rates. Peak hours are 01:00 - 04:00 and 06:00 - 10:00 UTC, Monday through Friday, excluding Chinese public holidays. All other hours are off-peak, including weekends and Chinese public holidays in full.

(3) For more details on concurrency limits, please refer to [Rate Limit & Isolation](https://api-docs.deepseek.com/quick_start/rate_limit).

* * *

## Deduction Rules[​](https://api-docs.deepseek.com/quick_start/pricing#deduction-rules "Direct link to Deduction Rules")

The expense = number of tokens × price. The corresponding fees will be directly deducted from your topped-up balance or granted balance, with a preference for using the granted balance first when both balances are available.

Product prices may vary and DeepSeek reserves the right to adjust them. We recommend topping up based on your actual usage and regularly checking this page for the most recent pricing information.
