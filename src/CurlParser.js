import Immutable from 'immutable'

import ShellTokenizer from './ShellTokenizer'

export class CurlRequest extends Immutable.Record({
  url: null,
  method: null,
  headers: Immutable.OrderedMap(),
  bodyType: null,
  body: null,
}) {

}

const TOKEN_BREAK = Immutable.List(['|', '>', '1>', '2>', '&>'])

export default class CurlParser {
  constructor() {
    this.requests = Immutable.List()
    this.args = null
    this.idx = (-1)
  }

  _getArg() {
    if (this.idx < this.args.count()) {
      return this.args.get(this.idx)
    }
    return null
  }

  _popArg() {
    if (this.idx < this.args.count()) {
      return this.args.get(this.idx++)
    }
    return null
  }

  parse(string) {
    this.idx = 0
    this.args = new ShellTokenizer().tokenize(string)
    this._parseAll()
    return this.requests
  }

  _parseAll() {
    let arg
    while ((arg = this._popArg()) != null) {
      if (arg.toLowerCase() == 'curl') {
        this._parseCurlCommand()
      }
    }
  }

  _parseCurlCommand() {
    let request = new CurlRequest()
    let urls = Immutable.List()
    let arg
    while ((arg = this._popArg()) != null) {
      if (TOKEN_BREAK.includes(arg)) {
        break;
      }
      else if (arg == '-H' || arg == '--header') {
        request = this._parseHeader(request)
      }
      else if (arg == '-F' || arg == '--form') {
        request = this._parseFormData(request)
      }
      else {
        urls = urls.push(this._cleanUrl(arg))
      }
    }
    if (request.get('method') == null) {
      request = request.set('method', 'GET')
    }
    urls.forEach(url => {
      const r = request.set('url', url)
      this.requests = this.requests.push(r)
    })
  }

  _cleanUrl(url) {
    if (!url.match(/^https?\:\/\//)) {
      return 'http://' + url
    }
    return url
  }

  _parseHeader(request) {
    const arg = this._popArg()
    const m = arg.match(/(?:^([^\:\s]+)\s*\:\s*(.*)$)/)
    if (!m) {
      throw new Error('Invalid -H/--header value: ' + arg)
    }
    return request.setIn(['headers', m[1]], m[2])
  }

  _parseFormData(request) {
    if (request.get('bodyType') != 'formData') {
      if (request.get('bodyType') != null) {
        throw new Error('Different body types set in the same request')
      }
      request = request.merge({
        bodyType: 'formData',
        body: Immutable.OrderedMap()
      })
    }
    const arg = this._popArg()
    const m = arg.match(/(?:^([^\=\s]+)\s*\=\s*([^\;]*))/)
    if (!m) {
      throw new Error('Invalid -F/--form value: ' + arg)
    }
    return request.setIn(['body', m[1]], m[2])
  }
}
