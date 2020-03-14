import {
  toParserState,
  digit,
  many,
  string,
  str,
  sequence,
  choice,
  ignoreIfOk
} from "./../../src/main"

describe("parsers test suite", () => {
  test("digit@succeed in parsing digts from 0 to 9", () => {
    for (let i = 0; i < 10; ++i) {
      const result = digit.parse(toParserState(i.toString()))
      expect(result.result).toEqual(i.toString())
      expect(result.isError).toBe(false)
    }
  })

  test("digit@fail to parse anything that's not a digit", () => {
    const result = digit.parse(toParserState("a"))

    expect(result.isError).toEqual(true)
  })

  test("many@keep parsing as long as the parser finds a match", () => {
    const parserResult = many(digit).parse(toParserState("01234"))

    expect(parserResult.isError).toBe(false)
    expect(parserResult.result.length).toBe(5)

    for (let i = 0; i < parserResult.result.length; ++i) {
      expect(parserResult.result[i]).toBe(i.toString())
    }
  })

  test("string@match a single character", () => {
    const parserResult = string.parse(toParserState("abc"))

    expect(parserResult.result).toBe("a")
    expect(parserResult.source).toBe("bc")
  })

  test("string@fail to match digits", () => {
    const parserResult = string.parse(toParserState("123abc"))

    expect(parserResult.isError).toBe(true)
  })

  test("many@stop parsing as soon as the parser fails to match", () => {
    const parserResult = many(digit).parse(toParserState("01abc34"))

    expect(parserResult.isError).toBe(false)
    expect(parserResult.result.length).toBe(2)

    for (let i = 0; i < parserResult.result.length; ++i) {
      expect(parserResult.result[i]).toBe(i.toString())
    }
  })

  test("str@ match provided string", () => {
    const parserResult = str("hello").parse(toParserState("hello world"))

    expect(parserResult.isError).toBe(false)
    expect(parserResult.result).toBe("hello")
    expect(parserResult.source).toBe(" world")
  })

  test("str@fail to match if provided string can't be found", () => {
    const parserResult = str("hello").parse(toParserState("world"))

    expect(parserResult.isError).toBe(true)
    expect(parserResult.source).toBe("world")
  })

  test("sequence@successfully match a sequence of parsers", () => {
    const source = toParserState("1a2b3c?")

    const parserResult = sequence([
      digit,
      string,
      digit,
      string,
      digit,
      string,
      string
    ]).parse(source)

    expect(parserResult.result.length).toBe(7)
    expect(parserResult.isError).toBe(false)
  })

  test("sequence@fail if one of the provided parsers fail", () => {
    const source = toParserState("1a23")

    const parserResult = sequence([digit, string, digit, string]).parse(source)

    expect(parserResult.isError).toBe(true)
  })

  test("choice@ match any of the provided parsers", () => {
    const firstParserResult = choice([digit, string]).parse(toParserState("1a"))

    expect(firstParserResult.isError).toBe(false)
    expect(firstParserResult.result).toBe("1")

    const secondParserResult = choice([digit, string]).parse(
      toParserState("a1")
    )

    expect(secondParserResult.isError).toBe(false)
    expect(secondParserResult.result).toBe("a")
  })

  test("choice@error if none of the provided parsers can match", () => {
    const parserResult = choice([str("a"), str("b")]).parse(toParserState("c"))

    expect(parserResult.isError).toBe(true)
  })

  test("ignoreIfOk@ignore parser result if it's not an error", () => {
    const parserResult = many(
      choice([ignoreIfOk(many(str(" "))), digit, string])
    ).parse(toParserState(" abc"))

    expect(parserResult.isError).toBe(false)
    expect(parserResult.result[0]).toBe("a")
  })

  test("ignoreIfOk@return error if parser can't match", () => {
    const parserResult = ignoreIfOk(digit).parse(toParserState("abc"))

    expect(parserResult.isError).toBe(true)
  })
})
