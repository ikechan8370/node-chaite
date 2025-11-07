import { DocumentFileParser, DocumentPathParser, ParserType } from '../../types/document'
import * as fs from 'node:fs'

export class PdfFileParser extends DocumentPathParser {
  constructor () {
    super()
    this.type = 'pdf'
    this.supportedExtensions = ['.pdf']
    this.initPromise = this.initializePdfParse()
  }

  private initPromise: Promise<void>

  valid: boolean
  type: ParserType
  supportedExtensions: string[]

  private async initializePdfParse () {
    this.valid = await import('pdf-parse')
      .then(() => true)
      .catch(() => false)
  }

  async ready (): Promise<void> {
    await this.initPromise
  }

  async parse (documentPath: string): Promise<string> {
    if (this.valid) {
      const buffer = fs.readFileSync(documentPath)
      const { PDFParse } = await import('pdf-parse')
      const parser = new PDFParse({ data: buffer })
      const result = await parser.getText()
      await parser.destroy()
      return result.text
    }
    throw new Error('PDF parsing is not available. To enable this feature, please install pdf-parse: npm install pdf-parse')
  }
}

export class PdfBufferParser extends DocumentFileParser {
  constructor () {
    super()
    this.type = 'pdf'
    this.supportedExtensions = ['.pdf']
    this.initPromise = this.initializePdfParse()
  }

  private initPromise: Promise<void>

  private async initializePdfParse () {
    try {
      await import('pdf-parse')
      this.valid = true
    } catch {
      this.valid = false
    }
  }

  valid: boolean
  type: ParserType
  supportedExtensions: string[]

  async ready (): Promise<void> {
    await this.initPromise
  }

  async parse (buffer: Buffer): Promise<string> {
    if (this.valid) {
      const { PDFParse } = await import('pdf-parse')
      const parser = new PDFParse({ data: buffer })
      const result = await parser.getText()
      await parser.destroy()
      return result.text
    }
    throw new Error('PDF parsing is not available. To enable this feature, please install pdf-parse: npm install pdf-parse')
  }
}