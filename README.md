[![Build Status](https://travis-ci.org/luckymarmot/Paw-cURLImporter.svg?branch=master)](https://travis-ci.org/luckymarmot/Paw-cURLImporter)

# cURL Importer (Paw Extension)

A [Paw Extension](http://luckymarmot.com/paw/extensions/) to import [cURL commands](http://curl.haxx.se/docs/manpage.html) into Paw.

## Installation

Easily install this Paw Extension: [Install cURL Importer](https://luckymarmot.com/paw/extensions/cURLImporter)

## How to use?

* In Paw, go to File menu, then **Import Text**...
* Paste the cURL command, and make sure the Format is **cURL Importer**

## Available cURL Options

This importer does not support the full cURL syntax. Supported arguments are:

* `-H`    define header (use `:` to separate name and value)
* `-u` `--user` define username and password for Basic Auth (can also define in the URL with the format `http://username@password:domain.com`)
* `-X` `--request` define method, default to automatic (GET, or POST if body data is present)
* `-d` `--data` set data (will set the Content-Type header if not set with `-H` to urlencoded data). If method is not POST PUT or PATCh will encode in url
* `--data-urlencode` will append all calls into the body as url encoded data (like `-d` will encode in url for non post like methods)
* `-F` `-form` can be used to add form data
* `-e` `--referer` will set a Referer on the headers if not set with `-H`
* `-url` or last string, will set the url (including protocol, http etc)
* `--compressed` will *append* gzip to encoding headers
* `-A` `--user-agent` will set the `User-Agent` header if not set with `-H`
* `-b` `--cookie` will set the `Cookie` header if not set with `-H`

Do to OS X sandboxing, Paw cannot read from local files. You must embed all values directly in your curl commands.

## Examples

### Basic Auth

```shell
curl https://myuser:mypassword@httpbin.org/get
curl https://httpbin.org/get -u myuser:mypassword
```

### `application/json

```shell
curl http://httpbin.org/post -d '{"key":"va=l&u=e"}' -H Content-Type:application/json
```

## Development

### Build & Install

```shell
nvm install
npm install
npm run build
```

## License

This Paw Extension is released under the [MIT License](LICENSE). Feel free to fork, and modify!

Copyright © 2014 Paw Inc.

## Contributors

See [Contributors](https://github.com/luckymarmot/Paw-cURLImporter/graphs/contributors).
