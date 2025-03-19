import { DocumentFileParser, DocumentPathParser, ParserType } from '../../types/document'
import * as fs from 'node:fs'
import * as path from 'node:path'

const pureTextExtensions = [
  // 通用文本文件
  '.txt', '.text',

  // 标记语言
  '.md', '.markdown',
  '.html', '.htm',
  '.xml',
  '.yaml', '.yml',
  '.json',

  // 编程语言
  '', '.jsx', '.ts', '.tsx',
  '.py',
  '.java',
  '.c', '.cpp', '.h', '.hpp',
  '.cs',
  '.go',
  '.rb',
  '.php',
  '.swift',
  '.kt', '.kts',  // Kotlin
  '.scala',
  '.rs',  // Rust
  '.sh', '.bash',
  '.pl',  // Perl
  '.lua',

  // 配置文件
  '.ini',
  '.cfg', '.conf',
  '.properties',
  '.env',

  // 样式表
  '.css', '.scss', '.sass', '.less',

  // 其他脚本语言
  '.sql',
  '.r',
  '.vbs',  // VBScript
  '.ps1',  // PowerShell

  // 日志文件
  '.log',

  // 其他文本格式
  '.csv',
  '.tsv',

  // 版本控制
  '.gitignore',
  '.gitattributes',

  // 特定应用配置文件
  '.npmrc',
  '.babelrc',
  '.eslintrc',

  // LaTeX 文件
  '.tex',
]
export class PureTextFileParser extends DocumentPathParser {
  constructor() {
    super()
    this.type = 'txt'
    this.supportedExtensions = pureTextExtensions
  }

  type: ParserType
  supportedExtensions: string[]

  async parse(documentPath: string): Promise<string> {
    const buffer = fs.readFileSync(path.resolve(documentPath))
    return buffer.toString('utf8')
  }
}

export class PureTextBufferParser extends DocumentFileParser {
  constructor() {
    super()
    this.type = 'txt'
    this.supportedExtensions = pureTextExtensions
  }

  type: ParserType
  supportedExtensions: string[]

  async parse(buffer: Buffer): Promise<string> {
    return buffer.toString('utf8')
  }
}