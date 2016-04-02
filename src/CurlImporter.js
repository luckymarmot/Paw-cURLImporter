import CurlParser, { CurlFileReference } from './CurlParser'

@registerImporter
class CurlImporter {
  static identifier = 'com.luckymarmot.PawExtensions.cURLImporter';
  static title = 'cURL Importer';

  constructor() {
    this.options = {}
  }

  _resolveFileReference(value) {
    if (value instanceof CurlFileReference) {
      const dv = new DynamicValue("com.luckymarmot.FileContentDynamicValue", {})
      return new DynamicString(dv)
    }
    return value
  }

  _escapeSequenceDynamicValue(seq) {
    let escapeSequence = ''
    for (let i = 0; i < seq.length; i++) {
      const char = seq[i]
      if (char === "\n") { escapeSequence += "\\n" }
      else if (char === "\r") { escapeSequence += "\\r" }
      else if (char === "\t") { escapeSequence += "\\t" }
      else {
        let hexChar = char.charCodeAt(0).toString(16)
        if (hexChar.length === 1) {
          hexChar = '0' + hexChar
        }
        escapeSequence += "\\x" + hexChar
      }
    };
    return new DynamicValue("com.luckymarmot.EscapeSequenceDynamicValue", {
      escapeSequence: escapeSequence
    })
  }

  _toDynamicString(string, defaultToEmpty, resolveFileRefs) {
    if (!string) {
      if (defaultToEmpty) {
        return new DynamicString('')
      }
      return null
    }

    // resolve file references
    if (resolveFileRefs) {
      const resolvedString = this._resolveFileReference(string)
      if ("string" !== typeof resolvedString) {
        return resolvedString
      }
    }

    // split around special characters
    const re = /([^\x00-\x1f]+)|([\x00-\x1f]+)/gm
    let components = []
    let m
    while ((m = re.exec(string)) !== null) {
      if (m[1]) {
        components.push(m[1])
      }
      else {
        components.push(this._escapeSequenceDynamicValue(m[2]))
      }
    }
    return new DynamicString(...components)
  }

  _importPawRequest(context, curlRequest) {
    const headers = curlRequest.get('headers')
    const auth = curlRequest.get('auth')
    const bodyType = curlRequest.get('bodyType')
    const body = curlRequest.get('body')
    const contentType = headers.get('Content-Type')
    const timeout = curlRequest.get('timeout')

    // url + method
    let pawRequest = context.createRequest(
      "cURL",
      curlRequest.get('method'),
      this._toDynamicString(curlRequest.get('url'), true, true),
    )

    // set to parent + order
    if (this.options && this.options.parent) {
      this.options.parent.appendChild(pawRequest)
    }
    if (this.options && this.options.order) {
      pawRequest.order = this.options.order
      this.options.order += 1
    }

    // headers
    headers.forEach((value, key) => {
      pawRequest.setHeader(
        this._toDynamicString(key, true, true),
        this._toDynamicString(value, true, true)
      )
    })

    // auth
    if (auth) {
      if (auth.get('type') === 'basic') {
        const dv = new DynamicValue("com.luckymarmot.BasicAuthDynamicValue", {
          username: auth.get('username', ''),
          password: auth.get('password', '')
        })
        pawRequest.setHeader('Authorization', new DynamicString(dv))
      }
      else {
        console.error('Auth type ' + auth.get('type') + ' is not supported in Paw')
      }
    }

    // body
    if (bodyType === 'formData') {
      const keyValues = body.map((value, key) => {
        return [
          this._toDynamicString(key, true, true),
          this._toDynamicString(value, true, true),
          true
        ]
      }).toArray()
      const dv = new DynamicValue("com.luckymarmot.BodyMultipartFormDataDynamicValue", {
        keyValues: keyValues
      })
      pawRequest.body = new DynamicString(dv)
    }
    else if (bodyType === 'urlEncoded') {
      // this is not form url encoded, but a plain body string or file
      if (body.count() === 1 && !body.getIn([0, 'value'])) {
        pawRequest.body = this._toDynamicString(body.getIn([0, 'key']), true, true)
      }
      // if no Content-Type is set, or not set to application/x-www-form-urlencoded
      // consider the body as a plain string
      else if (!contentType || contentType !== 'application/x-www-form-urlencoded') {
        const bodyString = curlRequest.get('bodyString')
        if (contentType && contentType.indexOf('json') >= 0) {
          try {
            pawRequest.jsonBody = JSON.parse(bodyString)
          }
          catch (e) {
            console.error('Request seems to have a JSON body, but JSON parsing failed')
            pawRequest.body = bodyString
          }
        }
        else {
          pawRequest.body = bodyString
        }
      }
      else {
        const keyValues = body.map(keyValue => {
          let key = this._toDynamicString(keyValue.get('key'), true, true)
          let value = this._toDynamicString(keyValue.get('value'), true, true)
          return [key, value, true]
        }).toArray()
        const dv = new DynamicValue("com.luckymarmot.BodyFormKeyValueDynamicValue", {
          keyValues: keyValues
        })
        pawRequest.body = new DynamicString(dv)
      }
    }

    // timeout
    if (timeout) {
      pawRequest.timeout = timeout * 1000
    }
  }

  _importPawRequests(context, curlRequests) {
    curlRequests.forEach(curlRequest => {
      this._importPawRequest(context, curlRequest)
    })
  }

  canImport(context, items) {
    let a = 0, b = 0
    const re = /^[\>\$\s]*curl\s+./i
    for (let item of items) {
      a += 1
      if (re.test(item.content)) {
        b += 1
      }
    }
    return a > 0 ? (b / a) : 0
  }

  import(context, items, options) {
    this.options = options
    for (let item of items) {
      this.importString(context, item.content)
    }
    return true
  }

  importString(context, string) {
    const parser = new CurlParser()
    const curlRequests = parser.parse(string)
    if (curlRequests.count() === 0) {
      throw new Error('No curl request found')
    }
    this._importPawRequests(context, curlRequests)
    return true
  }
}
