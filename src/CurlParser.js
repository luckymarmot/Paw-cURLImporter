import Immutable from 'immutable'

import ShellTokenizer from './ShellTokenizer'

export class CurlRequest {

}

export default class CurlParser {
  constructor() {
    this.requests = Immutable.List()
  }

  parse(string) {
    const tokens = this._tokenize(string)
    return this._consumeTokens(tokens)
  }
}
