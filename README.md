[![Build Status](https://travis-ci.org/luckymarmot/Paw-cURLImporter.svg?branch=master)](https://travis-ci.org/luckymarmot/Paw-cURLImporter)

# cURL Importer (Paw Extension)

A [Paw Extension](http://luckymarmot.com/paw/extensions/) to import [cURL commands](http://curl.haxx.se/docs/manpage.html) into Paw.
## Installation

Easily install this Paw Extension: [Install Postman Importer](http://luckymarmot.com/paw/extensions/cURLImporter)

## How to use?

* In Paw, go to File menu, then Import Text...
* Past in the cURL command, and make sure the Format is "cURL Importer"

This importer does not support the full curl syntax. Supported abutments are:

* `-H`    define header (use `:` to separate name and value)
* `-u` `--user` define username and password (can also define in `url`)
* `-X` `--request` define method, default to automatic (GET, or POST if body data is present)
* `-d` `--data` set data (will set the Content-Type header if not set with `-H` to urlencoded data). If method is not POST PUT or PATCh will encode in url
* `--data-urlencode` will append all calls into the boday as url encoded data. like `-d` will encode in url for non post like methods
* `-F` `-form` can be used to add form data
* `-e` `--referer` will set a Referer on the headers if not set with `-H`
* `-url` or last string, will set the url (including protocol, http etc)
* `--compressed` will *append* gzip to encoding headers
* `-A` `--user-agent` will set the `User-Agent` header if not set with `-H`
* `-b` `--cookie` will set the `Cookie` header if not set with `-H`

Do to sandboxing we cant read local files so you must embed all values directly in your curl commands.

## Development

### Build & Install

```shell
npm install
cake build
cake install
```

### Watch

During development, watch for changes:

```shell
cake watch
```

## License

This Paw Extension is released under the [MIT License](LICENSE). Feel free to fork, and modify!

Copyright © 2014 Paw Inc.

## Contributors

See [Contributors](https://github.com/luckymarmot/Paw-cURLImporter/graphs/contributors).
