
class StringParser {
  constructor(constex, string) {
    this.constex = constex
    this.string = string
  }

  parse() {
    return {}
  }
}

class PawImporter {
  constructor(constex, data) {
    this.constex = constex
    this.data = data
  }

  import() {

  }
}

@registerImporter
class BaseImporter {
  static identifier = 'com.luckymarmot.PawExtensions.ExampleImporter'
  static title = 'Example Importer'

  importString(context, string) {
    const stringParser = new StringParser(context, string)
    const data = stringParser.parse()
    const pawImporter = new PawImporter(context, data)
    pawImporter.import()

    return true
  }
}
