export interface Function {
    name: string
    description: string
    parameters: Parameter
}

export interface Parameter {
    type: 'object'
    properties: Record<string, Property>
    required: string[]
}

export interface Property {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object'
    description: string | null
}

export interface Tool {
    type: 'function'
    function: Function
}

