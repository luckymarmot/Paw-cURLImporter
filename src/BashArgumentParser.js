import Immutable from 'immutable'

export class ParsedData {
  constructor() {
    this.data = Immutable.Map()
  }

  add(key, value) {
    if (this.data.has(key)) {
      this.data = this.data.set(key, this.data.get(key).push(value))
    } else {
      this.data = this.data.set(key, new Immutable.list([value]))
    }
  }

  get(key) {
    return this.clean(this.getRaw(key))
  }

  getRaw(key) {
    return this.data.get(key)
  }

  clean(value) {
    if (!value) {
      return value
    }
    let re = /^[\$]*\"((?:\\\"|[^\"])*?)\"$/
    let m
    if (m = re.exec(value) !== null) {
      return m[1].replace(/\\(\")/g, '$1')
    }
    re = /^[\$]*\'((?:\\\'|[^\'])*?)\'$/
    if (m = re.exec(value) !== null) {
      return m[1].replace(/\\(\')/g, '$1')
    }
    return value
  }
}

export class BashArgumentParser {
  constructor() {
    this.tokenParsers = Immutable.List()
  }

  _tokenize(string) {
    const re = /((?:(?:\"(?:\\\"|[^\"])*?\")|(?:\'[^\']*?\')|(?:\$\'(?:\\\'|[^\'])*?\')|(?:\\\s|\S))+)/gm;
    let tokens = Immutable.List()
    let m
    while ((m = re.exec(string)) !== null) {
      if (m.index === re.lastIndex) {
        re.lastIndex++;
      }
      tokens = tokens.push(m[1])
    }
    return tokens
  }

  parse(string) {
    const tokens = this._tokenize(string)
    return this._consumeTokens(tokens)
  }

  _consumeTokens(tokens) {
    let data = new ParsedData()
    let consumed = 0
    while (consumed <= tokens.size) {
      for (let parser of this.tokenParsers) {
        if (parser.match(tokens.get(consumed)), tokens.slice(consumed),  tokens) {
          consumed += parser.parse(tokens.slice(consumed), data)
          break
        }
      }
      data.add('__unparsed', tokens.get(consumed))
      consumed += 1
    }
    return data
  }
}
