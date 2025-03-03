import { DocumentFileParser, DocumentPathParser, ParserType } from '../../types'
import mammoth from 'mammoth'

export class DocxFileParser extends DocumentPathParser {
  constructor() {
    super()
    this.type = 'docx'
    this.supportedExtensions = ['docx']
  }

  type: ParserType
  supportedExtensions: string[]

  async parse(documentPath: string): Promise<string> {
    const raw = await mammoth.extractRawText({
      path: documentPath,
    })
    return raw.value
  }
}

export class DocxBufferParser extends DocumentFileParser {
  constructor() {
    super()
    this.type = 'docx'
    this.supportedExtensions = ['docx']
  }

  type: ParserType
  supportedExtensions: string[]

  async parse(buffer: Buffer): Promise<string> {
    const raw = await mammoth.extractRawText({
      buffer,
    })
    return raw.value
  }
}