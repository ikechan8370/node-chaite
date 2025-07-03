import express, { Router } from 'express'
import { Request, Response } from 'express'
import { ModelResponseChunk, SendMessageOption } from '../types/index'
import { Chaite } from '../core'
import { createClient } from '../adapters/index'
import { getFromChaiteConverter, getIntoChaiteConverter } from '../utils/converter'
import OpenAI from 'openai'

const router: Router = express.Router()

// List models endpoint
router.get('/models', async (req, res) => {
  try {
    const channelsManager = Chaite.getInstance().getChannelsManager()
    const channels = await channelsManager.getAllChannels()

    // Extract all unique models from channels
    const models = Array.from(new Set(
      channels
        .filter(channel => channel.status === 'enabled')
        .flatMap(channel => channel.models),
    )).map(id => ({
      id,
      object: 'model',
      created: Date.now(),
      owned_by: 'chaite',
    }))

    res.json({
      object: 'list',
      data: models,
    })
  } catch (error) {
    if (error instanceof Error) {
      Chaite.getInstance().getLogger().error('Error fetching models: ' + error.message)
    }
    res.status(500).json({ error: 'Failed to fetch models' })
  }
})


// Chat completions endpoint
router.post('/chat/completions', async (req: Request<object, object, OpenAI.ChatCompletionCreateParamsNonStreaming | OpenAI.ChatCompletionCreateParamsStreaming>, res: Response) => {
  const { model, messages, stream = false, temperature, top_p, max_tokens } = req.body

  if (!model || !messages) {
    res.status(400).json({ error: 'Missing required fields: model and messages' })
    return
  }

  try {

    const channelsManager = Chaite.getInstance().getChannelsManager()
    const channels = await channelsManager.getChannelByModel(model)

    if (channels.length === 0) {
      res.status(404).json({ error: `Model ${model} not available` })
      return
    }

    const channel = channels[0]
    await channel.options.ready()
    channel.options.setHistoryManager(Chaite.getInstance().getHistoryManager())
    channel.options.setLogger(Chaite.getInstance().getLogger())

    const client = createClient(channel.adapterType, channel.options)
    const fromChaiteConverter = getFromChaiteConverter('openai')
    const intoChaiteConverter = getIntoChaiteConverter('openai')
    const history = messages.map(intoChaiteConverter)
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.write('data: {"object":"chat.completion.chunk","model":"' + model + '","choices":[{"delta":{"role":"assistant"},"index":0,"finish_reason":null}]}\n\n')

      let fullText = ''
      const messageId = `chatcmpl-${Date.now()}`
      const sendOptions = {
        model: model as string,
        temperature: temperature as SendMessageOption['temperature'],
        stream: true,
        maxToken: max_tokens as SendMessageOption['maxToken'],
        disableHistoryRead: true,
        disableHistorySave: true,
        onChunk: async (chunk: ModelResponseChunk) => {
          if (chunk.delta && chunk.delta.length > 0) {
            const textContents = chunk.delta.filter(content => 'text' in content)

            if (textContents.length > 0) {
              // Combine all text contents from this chunk
              const contentText = textContents
                .map(content => ('text' in content) ? content.text : '')
                .join('')

              fullText += contentText

              const chunkData = {
                id: messageId,
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model,
                choices: [{
                  index: 0,
                  delta: {
                    content: contentText,
                  },
                  finish_reason: null,
                }],
              }

              res.write(`data: ${JSON.stringify(chunkData)}\n\n`)
            }

            // Handle tool calls if present
            if (chunk.toolCall) {
              const toolCallData = {
                id: messageId,
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model,
                choices: [{
                  index: 0,
                  delta: {
                    tool_calls: [chunk.toolCall],
                  },
                  finish_reason: null,
                }],
              }

              res.write(`data: ${JSON.stringify(toolCallData)}\n\n`)
            }
          }
        },
      }

      await client.sendMessageWithHistory(history, SendMessageOption.create(sendOptions))

    } else {
      const sendOptions = {
        model: model as string,
        maxToken: max_tokens as SendMessageOption['maxToken'],
        disableHistoryRead: true,
        disableHistorySave: true,
        temperature: temperature as SendMessageOption['temperature'],
      }
      const response = await client.sendMessageWithHistory(history, sendOptions)
      const openaiMsg = fromChaiteConverter(response)
      res.json({
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [{
          index: 0,
          message: openaiMsg,
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: response.usage.promptTokens,
          completion_tokens: response.usage.completionTokens,
          total_tokens: response.usage.totalTokens,
          cached_tokens: response.usage.cachedTokens,
          reasoning_tokens: response.usage.reasoningTokens,
        },
      })
    }
  } catch (error) {
    if (error instanceof Error) {
      Chaite.getInstance().getLogger().error('Error in chat completions:', error.message as never)
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Embeddings endpoint
router.post('/embeddings', async (req, res) => {
  const { model, input } = req.body

  if (!model || !input) {
    res.status(400).json({ error: 'Missing required fields: model and input' })
    return
  }

  try {
    const channelsManager = Chaite.getInstance().getChannelsManager()
    const channels = await channelsManager.getChannelByModel(model)

    if (channels.length === 0) {
      res.status(404).json({ error: `Model ${model} not available` })
      return
    }

    const channel = channels[0]
    await channel.options.ready()
    channel.options.setHistoryManager(Chaite.getInstance().getHistoryManager())
    channel.options.setLogger(Chaite.getInstance().getLogger())

    const client = createClient(channel.adapterType, channel.options)

    const inputs = Array.isArray(input) ? input : [input]
    // const embeddings = []
    const result = await client.getEmbedding(inputs, {
      model: model as string,
      dimensions: 0,
    })
    const embeddings: {object: string, embedding: number[], index: number}[] = result.embeddings.map(embedding => {
      return {
        object: 'embedding',
        embedding: embedding,
        index: 0,
      }
    })
    for (let i = 0; i < embeddings.length; i++) {
      embeddings[i].index = i
    }
    res.json({
      object: 'list',
      data: embeddings,
      model,
      usage: {
        prompt_tokens: -1,
        total_tokens: -1,
      },
    })

  } catch (error) {
    if (error instanceof Error) {
      Chaite.getInstance().getLogger().error('Error creating embeddings:', error.message as never)
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
