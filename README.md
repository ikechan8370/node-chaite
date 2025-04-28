# node-chaite

用于[chatgpt-plugin v3](https://github.com/ikechan8370/chatgpt-plugin/tree/v3)和[karin-plugin-chaite](https://github.com/ikechan8370/karin-plugin-chaite)的公用依赖。



只包含核心功能，尽可能轻量，不包含数据库和其他存储。

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

