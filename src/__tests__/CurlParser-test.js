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

  // 
  // testing -H --header options
  //

  testHeaderSimple() {
    this.__testCurlRequest('curl http://httpbin.org/get -H X-Paw:value', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'GET',
      headers: Immutable.OrderedMap({
        'X-Paw': 'value'
      })
    }))
  }

  testHeaderMultiple() {
    this.__testCurlRequest('curl http://httpbin.org/get -H X-Paw:value --header X-Paw-2:\\ my-value', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'GET',
      headers: Immutable.OrderedMap({
        'X-Paw': 'value',
        'X-Paw-2': 'my-value'
      })
    }))
  }

  testHeaderNormalization() {
    this.__testCurlRequest('curl http://httpbin.org/get -H x-paw:value --header CONTENT-TYPE:application/json', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'GET',
      headers: Immutable.OrderedMap({
        'X-Paw': 'value',
        'Content-Type': 'application/json'
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
  // testing -d --data --data-ascii --data-binary --data-raw options
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

  testFormDataKeyValueDataAscii() {
    this.__testCurlRequest('curl http://httpbin.org/get --data-ascii key=value', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({key: 'key', value: 'value'})
      ])
    }))
  }

  testFormDataKeyValueDataAsciiPlain() {
    this.__testCurlRequest('curl http://httpbin.org/get --data-ascii sometext', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({key: 'sometext', value: null})
      ])
    }))
  }

  testFormDataKeyValueDataBinary() {
    this.__testCurlRequest('curl http://httpbin.org/get --data-binary key=value', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({key: 'key', value: 'value'})
      ])
    }))
  }

  testFormDataKeyValueDataBinaryPlain() {
    this.__testCurlRequest('curl http://httpbin.org/get --data-binary sometext', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({key: 'sometext', value: null})
      ])
    }))
  }

  testFormDataKeyValueDataRaw() {
    this.__testCurlRequest('curl http://httpbin.org/get --data-raw key=value', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({key: 'key', value: 'value'})
      ])
    }))
  }

  testFormDataKeyValueDataRawPlain() {
    this.__testCurlRequest('curl http://httpbin.org/get --data-raw sometext', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({key: 'sometext', value: null})
      ])
    }))
  }

  testFormDataKeyValueFileReference() {
    this.__testCurlRequest('curl http://httpbin.org/get -d @filename.txt', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({
          key: new CurlFileReference({filepath: 'filename.txt', stripNewlines: true}),
          value: null
        })
      ])
    }))
  }

  testFormDataKeyValueFileReferenceDataAscii() {
    this.__testCurlRequest('curl http://httpbin.org/get --data-ascii @filename.txt', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({
          key: new CurlFileReference({filepath: 'filename.txt', stripNewlines: true}),
          value: null
        })
      ])
    }))
  }

  testFormDataKeyValueFileReferenceDataBinaryNoStripNewlines() {
    this.__testCurlRequest('curl http://httpbin.org/get --data-binary @filename.txt', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({
          key: new CurlFileReference({filepath: 'filename.txt', stripNewlines: false}),
          value: null
        })
      ])
    }))
  }

  testFormDataKeyValueNoFileReferenceInDataRaw() {
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
        new CurlKeyValue({
          key: new CurlFileReference({filepath: 'filename.txt', stripNewlines: true}),
          value: null
        }),
        new CurlKeyValue({
          key: new CurlFileReference({filepath: 'filename2.txt', stripNewlines: true}),
          value: null
        })
      ])
    }))
  }

  testFormDataKeyValueFileReferenceAndParams() {
    this.__testCurlRequest('curl http://httpbin.org/get -d @filename.txt -d @filename2.txt --data "name=Paw&key2=value2"', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({
          key: new CurlFileReference({filepath: 'filename.txt', stripNewlines: true}),
          value: null
        }),
        new CurlKeyValue({
          key: new CurlFileReference({filepath: 'filename2.txt', stripNewlines: true}),
          value: null
        }),
        new CurlKeyValue({
          key: 'name',
          value: 'Paw'
        }),
        new CurlKeyValue({
          key: 'key2',
          value: 'value2'
        }),
      ])
    }))
  }

  testFormDataKeyValueMixOfAll() {
    this.__testCurlRequest('curl http://httpbin.org/get --data $\'toto\\ntiti\' --data-binary @myfile.txt --data-raw @myfile.txt --data-ascii @myfile.txt -d @myfile.txt -d name=Paw -d key2=value2 -H Content-Type:text/plain', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      headers: Immutable.OrderedMap({
        'Content-Type':'text/plain'
      }),
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({
          key: 'toto\ntiti',
          value: null
        }),
        new CurlKeyValue({
          key: new CurlFileReference({filepath: 'myfile.txt', stripNewlines: false}),
          value: null
        }),
        new CurlKeyValue({
          key: '@myfile.txt',
          value: null
        }),
        new CurlKeyValue({
          key: new CurlFileReference({filepath: 'myfile.txt', stripNewlines: true}),
          value: null
        }),
        new CurlKeyValue({
          key: new CurlFileReference({filepath: 'myfile.txt', stripNewlines: true}),
          value: null
        }),
        new CurlKeyValue({
          key: 'name',
          value: 'Paw'
        }),
        new CurlKeyValue({
          key: 'key2',
          value: 'value2'
        }),
      ])
    }))
  }

  // 
  // testing --data-urlencode
  // 

  testFormDataUrlEncodeContent() {
    // content
    this.__testCurlRequest('curl http://httpbin.org/get --data-urlencode value', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({key: 'value', value: null})
      ])
    }))
  }

  testFormDataUrlEncodeEqualContent() {
    // =content
    this.__testCurlRequest('curl http://httpbin.org/get --data-urlencode =value', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({key: 'value', value: null})
      ])
    }))
  }

  testFormDataUrlEncodeNameContent() {
    // name=content
    this.__testCurlRequest('curl http://httpbin.org/get --data-urlencode key=value', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({key: 'key', value: 'value'})
      ])
    }))
  }

  testFormDataUrlEncodeFilename() {
    // @filename
    this.__testCurlRequest('curl http://httpbin.org/get --data-urlencode @filename.txt', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({key: new CurlFileReference({filepath: 'filename.txt', stripNewlines: false}), value: null})
      ])
    }))
  }

  testFormDataUrlEncodeNameFilename() {
    // name@filename
    this.__testCurlRequest('curl http://httpbin.org/get --data-urlencode name@filename.txt', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({key: 'name', value: new CurlFileReference({filepath: 'filename.txt', stripNewlines: false})})
      ])
    }))
  }

  testFormDataUrlEncodeEqualContentLooksLikeFilename() {
    this.__testCurlRequest('curl http://httpbin.org/get --data-urlencode =@filename', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({key: '@filename', value: null})
      ])
    }))
  }

  testFormDataUrlEncodeEqualContentSpecialCharacters() {
    this.__testCurlRequest('curl http://httpbin.org/get --data-urlencode =value=more@values', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({key: 'value=more@values', value: null})
      ])
    }))
  }

  testFormDataUrlEncodeNameContentWithSpecialCharacters() {
    this.__testCurlRequest('curl http://httpbin.org/get --data-urlencode key=value=more@values', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({key: 'key', value: 'value=more@values'})
      ])
    }))
  }

  testFormDataUrlEncodeNameAmbiguousAtAndEqualWithKey() {
    this.__testCurlRequest('curl http://httpbin.org/get --data-urlencode name@file=path', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({key: 'name@file', value: 'path'})
      ])
    }))
  }

  testFormDataUrlEncodeNameAmbiguousAtAndEqualNoKey() {
    this.__testCurlRequest('curl http://httpbin.org/get --data-urlencode @file=path', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({key: '@file', value: 'path'})
      ])
    }))
  }

  testFormDataUrlEncodeNameAmbiguousNameEqualAtValue() {
    this.__testCurlRequest('curl http://httpbin.org/get --data-urlencode name=@value', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'POST',
      bodyType: 'urlEncoded',
      body: Immutable.List([
        new CurlKeyValue({key: 'name', value: '@value'})
      ])
    }))
  }

  // 
  // testing --compressed option
  // 

  testCompressed() {
    this.__testCurlRequest('curl http://httpbin.org/get --compressed', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'GET',
      headers: Immutable.OrderedMap({
        'Accept-Encoding': 'gzip'
      })
    }))
  }

  testCompressedAnotherEncoding() {
    this.__testCurlRequest('curl http://httpbin.org/get -H Accept-Encoding:bzip2 --compressed', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'GET',
      headers: Immutable.OrderedMap({
        'Accept-Encoding': 'bzip2;gzip'
      })
    }))
  }

  // 
  // testing -A --user-agent option
  // 

  testUserAgent() {
    this.__testCurlRequest('curl http://httpbin.org/get --user-agent "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A"', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'GET',
      headers: Immutable.OrderedMap({
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A'
      })
    }))
  }

  testUserAgentShort() {
    this.__testCurlRequest('curl http://httpbin.org/get -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A"', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'GET',
      headers: Immutable.OrderedMap({
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A'
      })
    }))
  }

  testUserAgentOverride() {
    this.__testCurlRequest('curl http://httpbin.org/get -H "user-agent: Paw/2.2.7" -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A"', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'GET',
      headers: Immutable.OrderedMap({
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A'
      })
    }))
  }

  testUserAgentOverridden() {
    this.__testCurlRequest('curl http://httpbin.org/get -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A" -H "user-agent: Paw/2.2.7"', new CurlRequest({
      url: 'http://httpbin.org/get',
      method: 'GET',
      headers: Immutable.OrderedMap({
        'User-Agent': 'Paw/2.2.7'
      })
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
    console.log('expected:', JSON.stringify(expected), '\nrequests:', JSON.stringify(requests))
    this.assertTrue(Immutable.is(requests, expected))
  }
}
