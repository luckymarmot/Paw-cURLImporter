import {UnitTest, registerTest} from '../TestUtils'
import Immutable from 'immutable'
import fs from 'fs'

import { BashArgumentParser } from '../BashArgumentParser'

@registerTest
class TestTokenSplitting extends UnitTest {
  testExample() {
    this.__testSimpleSpaceSplit('toto titi', ['toto', 'titi']);
  }

  testExamplesFromYaml() {
    const tests = JSON.parse(
      require('fs').readFileSync(__dirname + '/generated/tests.json', 'utf8')
    ).tests;
    tests.forEach(item => {
      let output = item.output
      if ("string" == typeof(output)) {
        output = [output]
      }
      this.__testSimpleSpaceSplit(item.input, output)
    })
  }
  __testSimpleSpaceSplit(input, output) {
    let parser = new BashArgumentParser()
    let tokens = parser._tokenize(input)
    console.log(input, output, tokens.toJS());
    this.assertEqual(tokens.count(), Immutable.fromJS(output).count())
    // this.assertTrue(Immutable.is(tokens, Immutable.fromJS(output)))
  }
}
