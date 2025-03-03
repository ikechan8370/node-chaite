import { Parser, ValidExtension } from '../types'
import {
  DocxBufferParser,
  DocxFileParser,
  PdfBufferParser,
  PdfFileParser,
  PureTextBufferParser,
  PureTextFileParser,
} from '../rag'

/**
 * 文档解析器管理
 */
class DocumentParserManager {
  private parsers: Map<ValidExtension, Parser<unknown>[]> = new Map()

  constructor() {
    this.parsers = new Map()
  }

  public route<T>(ext: ValidExtension, target: T): Parser<T> | undefined {
    const parsers = this.parsers.get(ext)
    if (!parsers) return undefined

    return parsers.find(parser =>
      (parser as Parser<unknown>).isCompatibleType(target),
    ) as Parser<T> | undefined
  }

  public register<T>(parser?: Parser<T>): DocumentParserManager {
    if (!parser) return this
    parser.supportedExtensions.forEach(ext => {
      if (!this.parsers.has(ext)) {
        this.parsers.set(ext, [])
      }
      this.parsers.get(ext)!.push(parser as Parser<unknown>)
    })
    return this
  }
}

const documentParserManager = new DocumentParserManager()
documentParserManager.register(new DocxBufferParser())
  .register(new DocxFileParser())
  .register(new PureTextBufferParser())
  .register(new PureTextFileParser());

// 单独处理pdf依赖未安装或安装失败
(async () => {
  const pdfFileParser = new PdfFileParser()
  await pdfFileParser.ready()
  if (pdfFileParser.valid) {
    documentParserManager.register(pdfFileParser)
  }

  const pdfBufferParser = new PdfBufferParser()
  await pdfBufferParser.ready()
  if (pdfBufferParser.valid) {
    documentParserManager.register(pdfBufferParser)
  }
})()


export default {
  documentParserManager,
}

