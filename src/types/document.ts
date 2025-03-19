export type ParserType = 'docx' | 'xlsx' | 'pptx' | 'pdf' | 'txt' | 'other'
type TypePredicate<T> = (value: unknown) => value is T;
export interface Parser<T> {
  type: ParserType
  supportedExtensions: ValidExtension[]
  isCompatibleType: TypePredicate<T>;
  parse (document: T): Promise<string>
}

export type ValidExtension = `.${string}` | string
export type FilePath = `${string}${ValidExtension}`;

export class DocumentPathParser implements Parser<FilePath> {
  isCompatibleType(value: unknown): value is string {
    return typeof value === 'string'
  }

  supportedExtensions!: ValidExtension[]
  type!: ParserType

  parse(document: FilePath): Promise<string> {
    throw new Error('abstract class')
  }
}

export class DocumentFileParser implements Parser<Buffer> {
  isCompatibleType(value: unknown): value is Buffer {
    return Buffer.isBuffer(value)
  }

  supportedExtensions!: ValidExtension[]
  type!: ParserType

  parse(document: Buffer): Promise<string> {
    throw new Error('abstract class')
  }
}
