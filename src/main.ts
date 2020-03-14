type ParserState = {
  result: any
  source: string
  isError: boolean
  error?: string
}

export const toParserState = (source: string) => ({
  source,
  result: null,
  isError: false
})

type StateTransformerFunction = (state: ParserState) => ParserState

type Parser = {
  parse: StateTransformerFunction
  map: (parser: Parser) => Parser
}

const makeParser = (stateTransformer: StateTransformerFunction) => ({
  parse: stateTransformer,
  map: (parser: Parser) =>
    makeParser((state: ParserState) => parser.parse(stateTransformer(state)))
})

export const digit = makeParser((state: ParserState) => {
  const character = state.source.slice(0, 1)

  if (character < "0" || character > "9") {
    return {
      ...state,
      isError: true,
      error: `digit@expected a digit, got ${character}`
    }
  }

  return { ...state, result: character, source: state.source.slice(1) }
})

export const str = (target: string) =>
  makeParser((state: ParserState) => {
    if (!state.source.startsWith(target)) {
      return {
        ...state,
        isError: true,
        error: `str@expected a string, got ${state.source.slice(target.length)}`
      }
    }

    return {
      ...state,
      result: target,
      source: state.source.slice(target.length)
    }
  })

export const string = makeParser((state: ParserState) => {
  const character = state.source.slice(0, 1)

  const whiteListedCharacters = {
    "?": 1,
    _: 2
  }

  if (
    (character < "a" || character > "z") &&
    (character < "A" || character > "Z") &&
    !(character in whiteListedCharacters)
  ) {
    return {
      ...state,
      isError: true,
      error: `str@expected a string, got ${character}`
    }
  }

  return { ...state, result: character, source: state.source.slice(1) }
})

export const many = (parser: Parser) =>
  makeParser((state: ParserState) => {
    const results: any[] = []

    let previousState = state
    let currentState = state

    while (true) {
      currentState = parser.parse(currentState)

      if (currentState.isError) {
        return results.length === 0
          ? currentState
          : { ...previousState, result: results }
      }

      if (currentState.result) {
        results.push(currentState.result)
      }
      previousState = currentState
    }
  })

export const sequence = (parsers: Parser[]) =>
  makeParser((state: ParserState) => {
    const results: any[] = []

    let currentState = state

    for (const parser of parsers) {
      currentState = parser.parse(currentState)

      if (currentState.isError) {
        return currentState
      }

      results.push(currentState.result)
    }

    return { ...currentState, result: results }
  })

export const ignoreIfOk = (parser: Parser) =>
  makeParser((state: ParserState) => {
    const parserResult = parser.parse(state)

    return parserResult.isError
      ? parserResult
      : { ...state, source: parserResult.source }
  })

export const choice = (parsers: Parser[]) =>
  makeParser((state: ParserState) => {
    for (const parser of parsers) {
      const parserResult = parser.parse(state)

      if (!parserResult.isError) {
        return parserResult
      }
    }

    return {
      ...state,
      isError: true,
      error: "choice@failed to match any of the choices provided"
    }
  })

function main() {
  const source = toParserState("1 a2b3c")

  const operations = choice([str("*"), str("/"), str("+"), str("-")])

  const parserResult = many(
    choice([ignoreIfOk(many(str(" "))), operations, digit, string])
  ).parse(source)

  console.log("result", parserResult)
}
main()
