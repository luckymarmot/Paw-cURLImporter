import {UnitTest, registerTest} from '../TestUtils'
import Immutable from 'immutable'
import fs from 'fs'

import CurlParser, { CurlRequest } from '../CurlParser'

@registerTest
class TestCurlParser extends UnitTest {
  testSimple() {
    this.__testCurlRequest('curl http://httpbin.org/get', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'GET'
    }))
  }

  testSimpleNoHttp() {
    this.__testCurlRequest('curl httpbin.org/get', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'GET'
    }))
  }

  testSimpleHttps() {
    this.__testCurlRequest('curl https://httpbin.org/get', new CurlRequest({
      url: 'https://httpbin.org/get',
      method: 'GET'
    }))
  }

  testMultipleRequests() {
    this.__testCurlRequests('curl http://httpbin.org/get http://httpbin.org/post', Immutable.List([
      new CurlRequest({
        url: 'http://httpbin.org/get',
        method: 'GET'
      }),
      new CurlRequest({
        url: 'http://httpbin.org/post',
        method: 'GET'
      })
    ]))
  }

  testSimpleHeader() {
    this.__testCurlRequest('curl http://httpbin.org/get -H X-Paw:value', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'GET',
      headers: Immutable.OrderedMap({
        'X-Paw': 'value'
      })
    }))
  }

  testSimpleHeaderMultiple() {
    this.__testCurlRequest('curl http://httpbin.org/get -H X-Paw:value --header X-Paw-2:\\ my-value', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'GET',
      headers: Immutable.OrderedMap({
        'X-Paw': 'value',
        'X-Paw-2': 'my-value'
      })
    }))
  }

  testSimpleFormData() {
    this.__testCurlRequest('curl http://httpbin.org/get -F key=value', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'GET',
      bodyType: 'formData',
      body: Immutable.OrderedMap({
        'key': 'value'
      })
    }))
  }

  testFormDataMultiple() {
    this.__testCurlRequest('curl http://httpbin.org/get -F key=value -F name=Paw', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'GET',
      bodyType: 'formData',
      body: Immutable.OrderedMap({
        'key': 'value',
        'name': 'Paw'
      })
    }))
  }

  testFormDataWithParams() {
    this.__testCurlRequest('curl http://httpbin.org/get -F key=value;type=text/plain', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'GET',
      bodyType: 'formData',
      body: Immutable.OrderedMap({
        'key': 'value'
      })
    }))
  }

  __testCurlRequest(input, expected) {
    this.__testCurlRequests(input, Immutable.List([expected]))
  }

  __testCurlRequests(input, expected) {
    let parser = new CurlParser()
    let requests = parser.parse(input)
    console.log('expected:', expected, '\nrequests:', requests)
    this.assertTrue(Immutable.is(requests, expected))
  }
}
