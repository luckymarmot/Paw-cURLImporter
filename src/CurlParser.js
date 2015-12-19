import Immutable from 'immutable'

import ShellTokenizer from './ShellTokenizer'

export class CurlFileReference extends Immutable.Record({
  filepath: null
}) { }

export class CurlKeyValue extends Immutable.Record({
  key: null,
  value: null
}) { }

export class CurlRequest extends Immutable.Record({
  url: null,
  method: null,
  headers: Immutable.OrderedMap(),
  bodyType: null,
  body: null,
}) { }

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
      if (arg.toLowerCase() === 'curl') {
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
      else if (arg === '-X' || arg === '--request') {
        request = this._parseMethod(request)
      }
      else if (arg === '-I' || arg === '--head') {
        request = request.set('method', 'HEAD')
      }
      else if (arg === '-H' || arg === '--header') {
        request = this._parseHeader(request)
      }
      else if (arg === '-F' || arg === '--form') {
        request = this._parseMultipartFormData(request)
      }
      else if (arg === '-d' || arg === '--data' || arg === '--data-ascii') {
        request = this._parseUrlEncodedData(request, '--data')
      }
      else if (arg === '--data-binary') {
        request = this._parseUrlEncodedData(request, '--data-binary')
      }
      else if (arg === '--data-raw') {
        request = this._parseUrlEncodedData(request, '--data-raw')
      }
      else if (arg === '--data-urlencode') {
        request = this._parseUrlEncodedData(request, '--data-urlencode')
      }
      else {
        urls = urls.push(this._cleanUrl(arg))
      }
    }
    if (request.get('method') === null) {
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

  _resolveFileReference(string) {
    const m = string.match(/^\@(.*)$/)
    if (m) {
      return new CurlFileReference({
        filepath: m[1]
      })
    }
    return string
  }

  _parseHeader(request) {
    const arg = this._popArg()
    const m = arg.match(/^([^\:\s]+)\s*\:\s*(.*)$/)
    if (!m) {
      throw new Error('Invalid -H/--header value: ' + arg)
    }
    return request.setIn(['headers', m[1]], m[2])
  }

  _parseMethod(request) {
    const arg = this._popArg()
    return request.set('method', arg)
  }

  _parseMultipartFormData(request) {
    // switch bodyType
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
    const m = arg.match(/^([^\=]+)\=([^\;]*)/)
    if (!m) {
      throw new Error('Invalid -F/--form value: ' + arg)
    }

    // set body param
    request = request.setIn(['body', m[1]], m[2])

    // set method if not set
    if (request.get('method') === null) {
      request = request.set('method', 'POST')
    }

    return request
  }

  _parseUrlEncodedData(request, option) {
    // switch bodyType
    if (request.get('bodyType') != 'urlEncoded') {
      if (request.get('bodyType') != null) {
        throw new Error('Different body types set in the same request')
      }
      request = request.merge({
        bodyType: 'urlEncoded',
        body: Immutable.List()
      })
    }

    const arg = this._popArg()
    
    if (option === '--data' || option === '--data-raw') {
      let value = arg

      // resolve file reference @filename
      if (option === '--data') {
        value = this._resolveFileReference(value)
      }

      // if file reference
      if (value instanceof CurlFileReference) {
        request = request.set('body', request.get('body').push(new CurlKeyValue({
          key: value
        })))
      }
      // otherwise, parse the parameters
      else {
        let components = value.split('&')
        for (let i = 0; i < components.length; i++) {
          const component = components[i]
          let m = component.match(/([^\=]+)(?:\=(.*))?/)
          request = request.set('body', request.get('body').push(new CurlKeyValue({
            key: decodeURIComponent(m[1]),
            value: (m[2] !== undefined ? decodeURIComponent(m[2]) : null)
          })))
        };
      }
    }
    else {
      throw new Error('!!! NOT IMPLEMENTED')
    }

    // set method if not set
    if (request.get('method') === null) {
      request = request.set('method', 'POST')
    }

    return request
  }
}
