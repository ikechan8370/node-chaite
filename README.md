# node-chaite

用于[chatgpt-plugin v3](https://github.com/ikechan8370/chatgpt-plugin/tree/v3)和[karin-plugin-chaite](https://github.com/ikechan8370/karin-plugin-chaite)的公用依赖。



只包含核心功能，尽可能轻量，不包含数据库和其他存储。

### Claude thinking 兼容

Claude 4.6 及更新的自适应模型会自动使用 `thinking.type=adaptive`，通过已有的
`reasoningEffort` 设置 `output_config.effort`；Haiku 4.5、Sonnet 4.5 等旧模型仍使用
`reasoningBudgetTokens`。自适应请求不再发送手动预算或温度参数。手动预算必须至少为
1024，且小于 `maxToken`。

若网关重命名了模型，无法从名称判断版本，可在 `SendMessageOption` 中显式覆盖：

```js
{
  model: 'my-haiku-alias',
  enableReasoning: true,
  claudeThinkingMode: 'adaptive',
  claudeEffort: 'high', // low / medium / high / xhigh / max
  maxToken: 8192
}
```

Claude 返回的 thinking 签名、redacted thinking 和工具调用块会随历史原样保留。
不要删除 `provider_context` 内容或修改其中的签名；它们用于后续工具轮次的协议回传，
不用于显示。新模型不支持 assistant prefill，请以用户消息或工具结果结束请求。

### OpenAI / Gemini 协议兼容

- OpenAI 推理模型会省略不支持的温度参数；可用 `openaiReasoningEffort` 指定
  `none/minimal/low/medium/high/xhigh/max`，具体可用值取决于模型。
- OpenAI 官方请求不发送 `thinking_budget_tokens`。llama-server 等明确支持该扩展的
  兼容服务，改用 `openaiThinkingBudgetTokens` 显式设置，不再复用所有预设里的通用预算。
- 未识别为 OpenAI 官方模型的兼容服务默认使用 `max_tokens`。可用
  `openaiMaxTokenField: 'max_tokens' | 'max_completion_tokens'` 覆盖网关需求。
- OpenAI 当前适配器使用 Chat Completions。GPT-6 Astra、GPT-6.1 Sol 的工具调用需要
  Responses API，配置这些模型与工具时会给出明确错误，不能通过换 SDK 参数实现。
- Gemini 3/4 使用 `thinkingLevel`，2.5 使用 `thinkingBudget`。可用
  `geminiThinkingLevel: 'minimal' | 'low' | 'medium' | 'high'` 覆盖自动映射；不支持关闭
  thinking 的模型使用其最低支持等级，2.5 Pro 使用最低预算 128。
- Gemini 原始 parts、空签名、函数调用顺序和服务端工具上下文会完整保留。
  两个适配器均规范化图片 MIME/Base64，`toolChoice=none` 会禁用工具。

协议回归测试无需真实 API Key：先运行 `pnpm build`，再运行 `pnpm test:adapters`，
使用本机临时 HTTP 服务验证构建产物与真实 SDK 的两轮工具调用（含 OpenAI 流式并行调用）。

### 预计功能

- [x] 主要LLM适配器
  - [x] OpenAI
    - [x] 对话
    - [x] 视觉/音频
    - [x] 工具
    - [x] 嵌入
  - [x] Gemini
    - [x] 对话
    - [x] 视觉
    - [x] 工具
    - [x] 嵌入
  - [x] Claude
    - [x] 对话
    - [x] 视觉
    - [x] 工具
  - [ ] 消息转换器 custom hook
- [x] 处理器
  - [x] 前处理器
  - [x] 后处理器
- [ ] 其他模型接口抽象
  - [ ] 生图
  - [ ] 音频    
- [x] 触发器
  - [x] Cron触发器
  - [] Event     
- [x] 抽象历史管理
- [x] 知识库
  - [x] 抽象向量库构建
  - [x] 抽象检索
- [x] 辅助工具
  - [x] 多模态文件解析
    - [x] 管理器 documentParserManager
    - [x] txt
    - [x] word
    - [x] pdf
- [x] 预设/工具管理
  - [x] 本地热插拔
  - [x] 云端共享
  - [x] 点对点共享
  - [x] 云端实现
- [x] 渠道管理

