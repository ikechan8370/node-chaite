// Offline protocol regression against built adapters and their bundled SDKs.
// Run: pnpm build && pnpm test:adapters
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { OpenAIClient, GeminiClient, ClaudeClient, ChaiteContext, InMemoryHistoryManager } from '../dist/index.mjs'

const requests = new Map()
const paths = new Map()
const firstGeminiParts = withIds => [
  { thought: true, text: '', thoughtSignature: 'empty-signature' },
  { functionCall: { ...(withIds ? { id: 'call-a' } : {}), name: 'search', args: { q: 'a' } }, thoughtSignature: 'sig-a' },
  { text: '  working\n', thoughtSignature: 'text-signature' },
  { toolCall: { id: 'server', toolType: 'GOOGLE_SEARCH', args: {} } },
  { functionCall: { ...(withIds ? { id: 'call-b' } : {}), name: 'weather', args: { q: 'b' } }, thoughtSignature: 'sig-b' },
]
const claudeParts = [
  { type: 'thinking', thinking: '', signature: 'claude-signature' },
  { type: 'redacted_thinking', data: 'redacted' },
  { type: 'tool_use', id: 'call-a', name: 'search', input: { q: 'a' } },
]
const server = createServer(async (req, res) => {
  const name = req.url.split('/')[1]
  paths.set(name, [...(paths.get(name) || []), req.url])
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const body = JSON.parse(Buffer.concat(chunks))
  const seen = requests.get(name) || []
  seen.push(body)
  requests.set(name, seen)
  const first = seen.length === 1
  if (name.startsWith('gemini')) {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ candidates: [{ content: { role: 'model', parts: first ? firstGeminiParts(name === 'gemini_ids') : [{ text: 'done' }] }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, thoughtsTokenCount: 2, totalTokenCount: 17 } }))
  } else if (name === 'claude') {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ id: 'message', type: 'message', role: 'assistant', model: body.model,
      content: first ? claudeParts : [{ type: 'text', text: 'done' }], stop_reason: first ? 'tool_use' : 'end_turn',
      usage: { input_tokens: 10, output_tokens: 5, output_tokens_details: { thinking_tokens: 2 } } }))
  } else if (body.stream) {
    res.writeHead(200, { 'content-type': 'text/event-stream' })
    const send = (delta, finish_reason = null) => res.write(`data: ${JSON.stringify({ id: 'stream', object: 'chat.completion.chunk', model: body.model, created: 0, choices: [{ index: 0, delta, finish_reason }] })}\n\n`)
    send({ role: 'assistant', ...(first ? { reasoning_content: 'think ' } : { content: 'done' }) })
    if (first) {
      send({ reasoning_content: 'more', tool_calls: [
        { index: 0, id: 'call-a', type: 'function', function: { name: 'search', arguments: '{"q":' } },
        { index: 1, id: 'call-b', type: 'function', function: { name: 'weather', arguments: '{"q":' } },
      ] })
      send({ tool_calls: [{ index: 1, function: { arguments: '"b"}' } }] })
      send({ tool_calls: [{ index: 0, function: { arguments: '"a"}' } }] })
    }
    send({}, first ? 'tool_calls' : 'stop')
    res.end('data: [DONE]\n\n')
  } else {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ id: 'message', object: 'chat.completion', created: 0, model: body.model,
      choices: [{ index: 0, finish_reason: first ? 'tool_calls' : 'stop', message: first ? {
        role: 'assistant', content: null, reasoning_content: 'think more', tool_calls: [
          { id: 'call-a', type: 'function', function: { name: 'search', arguments: '{"q":"a"}' } },
          { id: 'call-b', type: 'function', function: { name: 'weather', arguments: '{"q":"b"}' } },
        ],
      } : { role: 'assistant', content: 'done' } }], usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 } }))
  }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
try {
  for (const name of ['openai_plain', 'openai_stream', 'gemini_ids', 'gemini_noids', 'claude']) {
    const logger = { debug () {}, info () {}, warn () {}, error () {} }
    const context = new ChaiteContext(logger)
    context.setChaite({ getGlobalConfig: () => ({ getDebug: () => false }), getToolsGroupManager: () => null, getToolsManager: () => null, getOperationLogManager: () => null })
    const called = []
    const tools = ['search', 'weather'].map(tool => ({ name: tool, type: 'function',
      function: { name: tool, description: tool, parameters: { type: 'object', properties: { q: { type: 'string' } }, required: ['q'], additionalProperties: false } },
      run: async args => { called.push({ name: tool, args }); return `result-${args.q}` },
    }))
    const gemini = name.startsWith('gemini')
    const Class = gemini ? GeminiClient : name === 'claude' ? ClaudeClient : OpenAIClient
    const client = new Class({ apiKey: 'test', baseUrl: `http://127.0.0.1:${server.address().port}/${name}${name === 'gemini_ids' ? '/v1beta' : ''}`, logger, tools, historyManager: new InMemoryHistoryManager() }, context)
    const deltas = []
    const result = await client.sendMessage({ role: 'user', content: [{ type: 'text', text: 'run tools' }] }, {
      model: gemini ? 'gemini-3.8-flash' : name === 'claude' ? 'claude-haiku-5-5' : name === 'openai_plain' ? 'gpt-5.4' : 'compatible-test',
      enableReasoning: true, reasoningEffort: 'high', reasoningBudgetTokens: 2000, temperature: 0.7, maxToken: 8192,
      stream: name === 'openai_stream', onChunk: async chunk => { deltas.push(chunk) }, toolChoice: { type: 'auto' }, toolGroupId: [],
    })
    const seen = requests.get(name)
    assert.equal(seen.length, 2, name)
    assert.equal(result.contents.find(content => content.type === 'text')?.text, 'done', name)
    assert.deepEqual(called, name === 'claude' ? [{ name: 'search', args: { q: 'a' } }] : [{ name: 'search', args: { q: 'a' } }, { name: 'weather', args: { q: 'b' } }], name)
    if (gemini) {
      assert.ok(paths.get(name).every(path => (path.match(/v1beta/g) || []).length === 1))
      assert.deepEqual(seen[0].generationConfig.thinkingConfig, { thinkingLevel: 'HIGH', includeThoughts: true })
      assert.deepEqual(seen[1].contents.find(content => content.role === 'model').parts, firstGeminiParts(name === 'gemini_ids'))
      const results = seen[1].contents.at(-1).parts
      assert.deepEqual(results.map(part => part.functionResponse.name), ['search', 'weather'])
      if (name === 'gemini_ids') assert.deepEqual(results.map(part => part.functionResponse.id), ['call-a', 'call-b'])
      else assert.ok(results.every(part => !('id' in part.functionResponse)))
      assert.equal(seen[0].tools[0].functionDeclarations[0].parametersJsonSchema.additionalProperties, false)
    } else if (name === 'claude') {
      assert.deepEqual(seen[0].thinking, { type: 'adaptive', display: 'summarized' })
      assert.deepEqual(seen[1].messages.find(message => message.role === 'assistant').content, claudeParts)
      assert.equal(result.usage.reasoningTokens, 2)
    } else {
      assert.equal('thinking_budget_tokens' in seen[0], false)
      const assistant = seen[1].messages.find(message => message.role === 'assistant')
      assert.equal(assistant.content, null)
      assert.deepEqual(assistant.tool_calls.map(call => call.id), ['call-a', 'call-b'])
      if (name === 'openai_plain') {
        assert.equal('temperature' in seen[0], false)
        assert.equal('reasoning_content' in assistant, false)
      } else {
        assert.equal(assistant.reasoning_content, 'think more')
        assert.deepEqual(deltas.flatMap(chunk => chunk.toolCall || []).map(call => call.id), ['call-b', 'call-a'])
      }
    }
    console.log(`PASS: ${name} built adapter and bundled SDK, two-round tool loop`)
  }
} finally {
  await new Promise(resolve => server.close(resolve))
}
