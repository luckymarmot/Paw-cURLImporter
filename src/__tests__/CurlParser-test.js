import {UnitTest, registerTest} from '../TestUtils'
import Immutable from 'immutable'
import fs from 'fs'

import CurlParser, { CurlRequest, CurlKeyValue, CurlFileReference } from '../CurlParser'

@registerTest
class TestCurlParser extends UnitTest {

  // 
  // testing simple with no option
  // 

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

  // 
  // testing -X --request options
  // 

  testMethodGET() {
    this.__testCurlRequest('curl http://httpbin.org/get -X GET', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'GET'
    }))
  }

  testMethodPOSTAfter() {
    this.__testCurlRequest('curl http://httpbin.org/get -X POST', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST'
    }))
  }

  testMethodPOSTBefore() {
    this.__testCurlRequest('curl -X POST http://httpbin.org/get', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST'
    }))
  }

  testMethodPOSTOverride() {
    this.__testCurlRequest('curl http://httpbin.org/get -X PATCH -X POST', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST'
    }))
  }

  testMethodPOSTLong() {
    this.__testCurlRequest('curl http://httpbin.org/get --request POST', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST'
    }))
  }

  testMethodHEAD() {
    this.__testCurlRequest('curl http://httpbin.org/get -X HEAD', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'HEAD'
    }))
  }

  // 
  // testing -I --head options
  // 

  testHeadOption() {
    this.__testCurlRequest('curl -I http://httpbin.org/get', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'HEAD'
    }))
  }

  testHeadOptionLong() {
    this.__testCurlRequest('curl --head http://httpbin.org/get', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'HEAD'
    }))
  }

  testHeadOptionOverrideGET() {
    this.__testCurlRequest('curl -I -X GET http://httpbin.org/get', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'GET'
    }))
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

  // 
  // testing -F --form options
  // 

  testSimpleFormData() {
    this.__testCurlRequest('curl http://httpbin.org/get -F key=value', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'formData',
      body: Immutable.OrderedMap({
        'key': 'value'
      })
    }))
  }

  testSimpleFormDataMethodOverrideBefore() {
    this.__testCurlRequest('curl http://httpbin.org/get -X PATCH -F key=value', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'PATCH',
      bodyType: 'formData',
      body: Immutable.OrderedMap({
        'key': 'value'
      })
    }))
  }

  testSimpleFormDataMethodOverrideAfter() {
    this.__testCurlRequest('curl http://httpbin.org/get -F key=value -X PATCH', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'PATCH',
      bodyType: 'formData',
      body: Immutable.OrderedMap({
        'key': 'value'
      })
    }))
  }

  testFormDataMultiple() {
    this.__testCurlRequest('curl http://httpbin.org/get -F key=value --form name=Paw', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
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
      method: 'POST',
      bodyType: 'formData',
      body: Immutable.OrderedMap({
        'key': 'value'
      })
    }))
  }

  // 
  // testing -d --data --data-binary options
  // 

  testFormDataKeyValue() {
    this.__testCurlRequest('curl http://httpbin.org/get -d key=value', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({key: 'key', value: 'value'})
      ])
    }))
  }

  testFormDataKeyValueMultiple() {
    this.__testCurlRequest('curl http://httpbin.org/get -d key=value --data key2=value2', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({key: 'key', value: 'value'}),
        new CurlKeyValue({key: 'key2', value: 'value2'})
      ])
    }))
  }

  testFormDataKeyValueOverrideMethodBefore() {
    this.__testCurlRequest('curl http://httpbin.org/get -X PATCH -d key=value', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'PATCH',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({key: 'key', value: 'value'})
      ])
    }))
  }

  testFormDataKeyValueOverrideMethodAfter() {
    this.__testCurlRequest('curl http://httpbin.org/get -d key=value -X PATCH', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'PATCH',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({key: 'key', value: 'value'})
      ])
    }))
  }

  testFormDataKeyValueUrlEncoded() {
    this.__testCurlRequest('curl http://httpbin.org/get -d ke%20y=val%20ue', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({key: 'ke y', value: 'val ue'})
      ])
    }))
  }

  testFormDataKeyValueEmptyValue() {
    this.__testCurlRequest('curl http://httpbin.org/get -d key=', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({key: 'key', value: ''})
      ])
    }))
  }

  testFormDataKeyValueNoValue() {
    this.__testCurlRequest('curl http://httpbin.org/get -d key', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({key: 'key', value: null})
      ])
    }))
  }

  testFormDataKeyValueMultipleValueInOneOption() {
    this.__testCurlRequest('curl http://httpbin.org/get -d "key=value&key2=value2"', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({key: 'key', value: 'value'}),
        new CurlKeyValue({key: 'key2', value: 'value2'})
      ])
    }))
  }

  testFormDataKeyValueMultipleValueInOneOptionUrlEncoded() {
    this.__testCurlRequest('curl http://httpbin.org/get -d "ke%20y=value&key2=value%2F2"', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({key: 'ke y', value: 'value'}),
        new CurlKeyValue({key: 'key2', value: 'value/2'})
      ])
    }))
  }

  testFormDataKeyValuePlayingWithEscapes() {
    this.__testCurlRequest('curl http://httpbin.org/get -d $\'key=v\\x61lue\'', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({key: 'key', value: 'value'})
      ])
    }))
  }

  testFormDataKeyValueFileReference() {
    this.__testCurlRequest('curl http://httpbin.org/get -d @filename.txt', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({key: new CurlFileReference({filepath: 'filename.txt'}), value: null})
      ])
    }))
  }

  testFormDataKeyValueFileReferenceDataAscii() {
    this.__testCurlRequest('curl http://httpbin.org/get --data-ascii @filename.txt', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({key: new CurlFileReference({filepath: 'filename.txt'}), value: null})
      ])
    }))
  }

  testFormDataKeyValueNoFileReferenceInRaw() {
    this.__testCurlRequest('curl http://httpbin.org/get --data-raw @filename.txt', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({key: '@filename.txt', value: null})
      ])
    }))
  }

  testFormDataKeyValueFileReferenceMultiple() {
    this.__testCurlRequest('curl http://httpbin.org/get -d @filename.txt --data @filename2.txt', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({key: new CurlFileReference({filepath: 'filename.txt'}), value: null}),
        new CurlKeyValue({key: new CurlFileReference({filepath: 'filename2.txt'}), value: null})
      ])
    }))
  }

  testFormDataKeyValueFileReferenceAndParams() {
    this.__testCurlRequest('curl http://httpbin.org/get -d @filename.txt -d @filename2.txt --data "name=Paw&key2=value2"', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({key: new CurlFileReference({filepath: 'filename.txt'}), value: null}),
        new CurlKeyValue({key: new CurlFileReference({filepath: 'filename2.txt'}), value: null}),
        new CurlKeyValue({key: 'name', value: 'Paw'}),
        new CurlKeyValue({key: 'key2', value: 'value2'}),
      ])
    }))
  }

  // 
  // helpers
  // 

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
