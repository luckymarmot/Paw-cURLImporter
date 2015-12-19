import Immutable from 'immutable'

import ShellTokenizer from './ShellTokenizer'

export class CurlFileReference extends Immutable.Record({
  filepath: null,
  stripNewlines: false
}) { }

export class CurlKeyValue extends Immutable.Record({
  key: null,
  value: null
}) { }

export class CurlAuth extends Immutable.Record({
  username: null,
  password: null,
  type: 'basic'
}) { }

export class CurlRequest extends Immutable.Record({
  url: null,
  method: null,
  headers: Immutable.OrderedMap(),
  bodyType: null,
  body: null,
  auth: null
}) {
  setAuthParams(authParams) {
    let auth = this.get('auth')
    if (auth == null) {
      auth = new CurlAuth()
    }
    auth = auth.merge(authParams)
    return this.set('auth', auth)
  }
}

const TOKEN_BREAK = Immutable.List(['|', '>', '1>', '2>', '&>', ';', '&', '&&'])

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

  _getLastArg() {
    if ((this.idx - 1) < this.args.count()) {
      return this.args.get(this.idx - 1)
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

        // if last argument was the -: --next option, continue parsing curl
        const lastArg = this._getLastArg()
        if (lastArg === '-:' || lastArg === '--next') {
          this._parseCurlCommand()
        }
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
      else if (arg === '-:' || arg === '--next') {
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
        request = this._parseUrlEncodedData(request, arg)
      }
      else if (arg === '--data-raw') {
        request = this._parseUrlEncodedData(request, arg)
      }
      else if (arg === '--data-urlencode') {
        request = this._parseUrlEncodedData(request, arg)
      }
      else if (arg === '--compressed') {
        request = this._parseCompressed(request)
      }
      else if (arg === '-A' || arg === '--user-agent') {
        request = this._parseUserAgent(request)
      }
      else if (arg === '-b' || arg === '--cookie') {
        request = this._parseCookie(request)
      }
      else if (arg === '-e' || arg === '--referer') {
        // note: spelling "referer" is a typo in the HTTP spec
        // while correct English is "Referrer", header name if "Referer" (one R)
        request = this._parseReferer(request)
      }
      else if (arg === '-u' || arg === '--user') {
        request = this._parseUser(request)
      }
      else if (arg === '--basic' ||
               arg === '--digest' ||
               arg === '--ntlm' ||
               arg === '--negotiate') {
        request = this._parseAuth(request, arg)
      }
      else if (arg.match(/^\-/)) {
        // ignore unknown arguments
        continue;
      }
      else {
        request = this._parseUrl(request, arg)
        urls = urls.push(request.get('url'))
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

  _parseUrl(request, url) {
    const m = url.match(/^(\w+\:\/\/)?(?:([^\:\/]+)(?:\:([^\@]+)?)?\@)?(.*)$/)
    if (m[2] && !request.getIn(['auth', 'password'])) {
      request = request.setAuthParams({
        username:m[2],
        password:(m[3] ? m[3] : null)
      })
    }
    request = request.set('url', (m[1] ? m[1] : 'http://') + m[4])
    return request
  }

  _normalizeHeader(string) {
    return string.replace(/[^\-]+/g, (m) => {
      return m[0].toUpperCase() + m.substr(1).toLowerCase()
    })
  }

  _resolveFileReference(string, stripNewlines) {
    const m = string.match(/^\@(.*)$/)
    if (m) {
      return new CurlFileReference({
        filepath: m[1],
        stripNewlines: stripNewlines
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
    return request.setIn(['headers', this._normalizeHeader(m[1])], m[2])
  }

  _parseMethod(request) {
    return request.set('method', this._popArg())
  }

  _parseCompressed(request) {
    let acceptEncoding = request.getIn(['headers', 'Accept-Encoding'])
    if (!acceptEncoding) {
      acceptEncoding = ''
    }
    if (!acceptEncoding.includes('gzip')) {
      if (acceptEncoding.length > 0) {
        acceptEncoding += ';'
      }
      acceptEncoding += 'gzip'
      request = request.setIn(['headers', 'Accept-Encoding'], acceptEncoding)
    }
    return request
  }

  _parseUserAgent(request) {
    return request.setIn(['headers', 'User-Agent'], this._popArg())
  }

  _parseCookie(request) {
    return request.setIn(['headers', 'Cookie'], this._popArg())
  }

  _parseReferer(request) {
    // note: spelling "referer" is a typo in the HTTP spec
    // while correct English is "Referrer", header name if "Referer" (one R)
    return request.setIn(['headers', 'Referer'], this._popArg())
  }

  _parseUser(request) {
    const m = this._popArg().match(/([^\:]+)(?:\:(.*))?/)
    return request.setAuthParams({
      username:m[1],
      password:(m[2] ? m[2] : null)
    })
  }

  _parseAuth(request, arg) {
    const m = arg.match(/\-{2}(\w+)/)
    return request.setAuthParams({
      type:m[1]
    })
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
    
    if (option === '--data' ||
        option === '--data-raw' ||
        option === '--data-binary') {
      let value = arg

      // resolve file reference @filename
      if (option === '--data' || option === '--data-binary') {
        const stripNewlines = (option !== '--data-binary')
        value = this._resolveFileReference(value, stripNewlines)
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
    else if (option === '--data-urlencode') {
      let m = arg.match(/^([^\=]+)?\=(.*)$/)
      // =content
      // name=content
      if (m) {
        request = request.set('body', request.get('body').push(new CurlKeyValue({
          key: (m[1] !== undefined ? m[1] : m[2]),
          value: (m[1] !== undefined ? m[2] : null)
        })))
      }
      // content
      // @filename
      // name@filename
      else {
        m = arg.match(/^([^\@]+)?(.+)?$/)
        let value = m[2] !== undefined ? this._resolveFileReference(m[2], false) : null
        request = request.set('body', request.get('body').push(new CurlKeyValue({
          key: (m[1] !== undefined ? m[1] : value),
          value: (m[1] !== undefined ? value : null)
        })))
      }
    }
    else {
      throw new Error('Invalid option ' + option)
    }

    // set method if not set
    if (request.get('method') === null) {
      request = request.set('method', 'POST')
    }

    return request
  }
}
