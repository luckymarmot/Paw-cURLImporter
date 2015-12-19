import CurlParser, { CurlFileReference } from './CurlParser'

@registerImporter
class CurlImporter {
  static identifier = 'com.luckymarmot.PawExtensions.cURLImporter'
  static title = 'cURL Importer'

  _resolveFileReference(value) {
    if (value instanceof CurlFileReference) {
      const dv = new DynamicValue("com.luckymarmot.FileContentDynamicValue", {})
      return new DynamicString(dv)
    }
    return value
  }

  _importPawRequest(context, curlRequest) {
    const headers = curlRequest.get('headers')
    const auth = curlRequest.get('auth')
    const bodyType = curlRequest.get('bodyType')
    const body = curlRequest.get('body')

    // url + method
    let pawRequest = context.createRequest("cURL", curlRequest.get('method'), curlRequest.get('url'))

    // headers
    headers.forEach((value, key) => {
      pawRequest.setHeader(key, value)
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
      pawRequest.multipartBody = body.toJS()
    }
    else if (bodyType === 'urlEncoded') {
      // this is not form url encoded, but a plain body string or file
      if (body.count() === 1 && !body.getIn([0, 'value'])) {
        pawRequest.body = this._resolveFileReference(body.getIn([0, 'key'], ''))
      }
      else {
        const keyValues = body.map(keyValue => {
          let key = this._resolveFileReference(keyValue.get('key'))
          let value = this._resolveFileReference(keyValue.get('value'))
          if (!(key instanceof DynamicString)) {
            key = new DynamicString(key || '')
          }
          if (!(value instanceof DynamicString)) {
            value = new DynamicString(value || '')
          }
          return [key, value, true]
        }).toArray()
        const dv = new DynamicValue("com.luckymarmot.BodyFormKeyValueDynamicValue", {
          keyValues: keyValues
        })
        pawRequest.body = new DynamicString(dv)
      }
    }
  }

  _importPawRequests(context, curlRequests) {
    curlRequests.forEach(curlRequest => {
      this._importPawRequest(context, curlRequest)
    })
  }

  importString(context, string) {
    const parser = new CurlParser()
    const curlRequests = parser.parse(string)
    this._importPawRequests(context, curlRequests)
    return true
  }
}
