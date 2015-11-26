cURLImporter = ->

    # Create Paw request
    @createPawRequest = (context, curlArgs, rawString) ->

        if not curlArgs or curlArgs.length < 0
            console.log "Invalid curl command"

        curlObj = {
            method: "GET",
            headers: {},
            body: null,
            multipartBody: null,
            url: ""
        }

        @resolveURL curlArgs, rawString, curlObj
        @resolveMethod curlArgs, curlObj
        @resolveHeaders curlArgs, curlObj

        @resolveBody curlArgs, curlObj

        @resolveCompressed curlArgs, curlObj
        @resolveUserAgent curlArgs, curlObj
        @resolveCookie curlArgs, curlObj
        @resolveReferer curlArgs, curlObj
        @resolveAuth curlArgs, curlObj

        @cleanUrl curlObj
        # Create Paw request
        pawRequest = context.createRequest "cURL", curlObj.method, curlObj.url


        for header, value of curlObj.headers
            pawRequest.setHeader(@clean(header), @clean(value))

        if curlObj.body != null
            pawRequest.body = curlObj.body
        else if curlObj.multipartBody != null
            pawRequest.multipartBody = curlObj.multipartBody
        return pawRequest

    @clean = (string) ->
        if typeof stringValue isnt 'string'
            return string
        if string == null
            return ""
        re = /^(?:\"([^\"]+)\"$|\'([^\']+)\'|[\ ]*([^\ ]+[^]*[^\ ]+)[\ ]*|[\ ]*([^\ ])[\ ]*)$/;
        m = re.exec(string)
        if m == null
            throw new Error "Invalid curl file unable to clean string: #{string}"
        if typeof m[1] isnt 'undefined'
            return m[1]
        else if typeof m[2] isnt 'undefined'
            return m[2]
        else if typeof m[3] isnt 'undefined'
            return m[3]
        else if typeof m[4] isnt 'undefined'
            return m[4]
        else
            throw new Error "Invalid curl file unable to clean string: #{string}"

    @cleanURL = (string) ->
      string = @clean string
      if not string.match(/^https?\:\/\//)
        string = 'http://' + string
      return string

    @resolveURL = (curlArgs, rawString, curlObj) ->
        if "url" of curlArgs
            urls = curlArgs.url
            curlObj.url = @cleanURL urls[urls.length-1]
        else
            re = /([^\ ]+)[\ ]*$/;
            m = re.exec(rawString)
            if m != null
                curlObj.url = @cleanURL m[1]

    @resolveMethod =  (curlArgs, curlObj) ->
        methods = ["GET"]
        if "X" of curlArgs
            methods = curlArgs.X
        else if "request" of curlArgs
            methods = curlArgs.request
        else if "data" of curlArgs
            methods = ["POST"]
        else if "d" of curlArgs
            methods = ["POST"]
        else if "data-urlencode" of curlArgs
            methods = ["POST"]
        else if "F" of curlArgs
            methods = ["POST"]
        else if "form" of curlArgs
            methods = ["POST"]

        curlObj.method = @clean methods[methods.length-1]

    @cleanHeader = (string) ->
        re = /(?:^\"([^\:]+)\:\ ([^"]+)\"$|^\'([^\:]+)\:\ ([^']+)\'$|^([^\:]+)\:\ ([^ ]+)$)/;
        if string == null
            return null
        m = re.exec(string)
        if m == null
            return null
        key = null
        if typeof m[1] isnt 'undefined'
            key = m[1]
            headerValue = m[2]
        else if typeof m[3] isnt 'undefined'
            key = m[3]
            headerValue = m[4]
        else if typeof m[5] isnt 'undefined'
            key = m[5]
            headerValue = m[5]
        if key == null
            console.log "cant pass header value #{string}"
            return null
        return {key: key, value: headerValue}

    @resolveHeaders =  (curlArgs, curlObj) ->
        headers = {}
        if "H" of curlArgs
            for header in curlArgs.H
                cleanedHeader = @cleanHeader header
                if cleanedHeader != null
                    headers[cleanedHeader.key] = cleanedHeader.value
        curlObj.headers = headers

    @resolveBody = (curlArgs, curlObj) ->
        dataBody = null
        dataBody = @getLast curlArgs, "d", dataBody
        dataBody = @getLast curlArgs, "data", dataBody
        if dataBody == null
            dataBody = @getDataUrlencode curlArgs
        if dataBody != null
            if dataBody[0] == "&"
                dataBody = dataBody.slice(1)
            if curlObj.method in ["POST", "PUT", "PATCH"]
                curlObj.body = dataBody
                if not ("Content-Type" of curlObj.headers)
                    curlObj.headers["Content-Type"] = "application/x-www-form-urlencoded" #TODO auto detect type and set so paw load automatically
            else
                url = curlObj.url
                if url.includes("?")
                    if url[url.length-1] != "?"
                        url += '&'
                else
                    url += "?"
                url += dataBody
                curlObj.url = url
        else
            parts = @getDataForm curlArgs
            if (parts != null)
                curlObj.multipartBody = parts

    @resolveCompressed = (curlArgs, curlObj) ->
        if @getLast(curlArgs, "compressed", false) != false
            currentEncoding = ""
            if "Accept-Encoding" of curlObj.headers
                currentEncoding = curlObj.headers["Accept-Encoding"]
            if currentEncoding.includes("gzip")
                return
            currentEncoding += ";gzip"
            if currentEncoding[0] == ';'
                currentEncoding = currentEncoding.slice(1)
            curlObj.headers["Accept-Encoding"] = currentEncoding

    @resolveUserAgent = (curlArgs, curlObj) ->
        if "User-Agent" of curlObj.headers
            return
        userAgent = null
        @getLast curlArgs, "user-agent", userAgent
        @getLast curlArgs, "A", userAgent
        if userAgent != null
            curlObj.headers["User-Agent"] = userAgent

    @resolveCookie =  (curlArgs, curlObj) ->
        if "Cookie" of curlObj.headers
            return
        cookie = null
        @getLast curlArgs, "b", cookie
        @getLast curlArgs, "cookie", cookie
        if cookie != null
            curlObj.headers["Cookie"] = cookie

    @resolveReferer = (curlArgs, curlObj) ->
        if "Referer" of curlObj.headers
            return
        referer = null
        @getLast curlArgs, "e", referer
        @getLast curlArgs, "referer", referer
        if referer != null
            curlObj.headers["Referer"] = referer

    @resolveAuth = (curlArgs, curlObj) ->
        notSet = {}
        if @getUserNameAndPassword(curlArgs, curlObj) == null
            return

        if @getLast(curlArgs, 'digest', notSet) != notSet
            console.log "digest auth is not supported"
            return

        if @getLast(curlArgs, 'ntlm', notSet) != notSet
            console.log "ntlm auth is not supported"
            return

        if @getLast(curlArgs, 'negotiate', notSet) != notSet
            console.log "negotiate auth is not supported"
            return

        @resolveBasicAuth curlArgs, curlObj

    @resolveBasicAuth = (curlArgs, curlObj) ->
        if ("Authorization" of curlObj.headers) or ("authorization" of curlObj.headers)
            return
        auth = @getUserNameAndPassword(curlArgs, curlObj)
        if auth == null
            return

        username = auth.username
        password = auth.password

        basicAuth = new DynamicValue(
          "com.luckymarmot.BasicAuthDynamicValue", {username: username, password, password})

        curlObj.headers["Authorization"] = new DynamicString(basicAuth)

    @getUserNameAndPassword = (curlArgs, curlObj) ->
        #filter the url
        re = /[\w]+\:\/\/(?:([^\.^\@^\:]+)\@([^\.^\@\:]+))\:[^\.^\"^\/]+./;
        m = re.exec(curlObj.url)
        if m != null

            return {username: m[1], password: m[2]}
        u = @getLast curlArgs, "u", null
        u = @getLast curlArgs, "user", u
        if u == null
            return null
        v = u.split(':')
        if v.length != 2
            return null
        return {username: v[0], password: v[1]}

    @cleanUrl = (curlObj) ->
        re = /^[\w]+\:\/\/(?:([^\.^\@\:]+\@[^\.^\@\:]+\:))[^\.^\"^\/]+\./;
        m = re.exec(curlObj.url)
        if m == null
            return
        url = curlObj.url
        url = m[0].replace(m[1], '') + url.slice(m[0].length)
        curlObj.url = url


    @getDataUrlencode = (curlArgs) ->
        if "data-urlencode" of curlArgs
            re = /(?:([^]*)\=([^]+$)|([^]+$))/;
            urlArgs = curlArgs["data-urlencode"]
            urlData = ""
            for arg in urlArgs
                cleanArg = @clean arg
                if cleanArg != null
                    m = re.exec(cleanArg)
                    if m == null
                        continue
                    newString = "&"
                    if typeof m[1] isnt 'undefined'
                        newString +=  m[1] + "="
                    if typeof m[2] isnt 'undefined'
                        newString += m[2]
                    else if typeof m[3] isnt 'undefined'
                        newString += m[3]
                    else
                        continue
                    if newString.length < 2
                        continue
                    urlData += newString
            return urlData
        return null

    @getDataForm = (curlArgs) ->
        rawParts = []
        if "F" of curlArgs
            rawParts = rawParts.concat(curlArgs["F"])
        if "form" of curlArgs
            rawParts = rawParts.concat(curlArgs["form"])
        if rawParts.length == 0
            return null
        parts = new Object()
        re = /(?:([^\=]+)\=([^\=\;]+))(?:[;]*type\=([^]*)$|)/;
        for rawPart in rawParts
            cleanRawPart = @clean rawPart
            m = re.exec(cleanRawPart)
            if m == null
                continue
            name = m[1]
            value = m[2]
            parts[name] = value

        return parts



    @getLast = (curlArgs, key, notFound) ->
        if key of curlArgs
            values = curlArgs[key]
            return @clean values[values.length-1]
        return notFound



    @importString = (context, string) ->
        re = /[ (?: \\\n)(?: \n)]+(?:(?:\-([\w])[\ ]*(\"[^\"]+\"|\'[^\']+\'|[\w]+|))|\-\-([\w\-]+)[\ ]*(\"[^\"]+\"|\'[^\']+\'|[\w]+|))+/gm;

        curlArgs = {}
        while not ((m = re.exec(string)) == null)
            if m.index == re.lastIndex
                re.lastIndex++
            if typeof m[1] isnt 'undefined'
                if not (m[1] of curlArgs)
                    curlArgs[m[1]] = []
                curlArgs[m[1]].push(m[2])
            else if typeof m[3] isnt 'undefined'
                if not (m[3] of curlArgs)
                    curlArgs[m[3]] = []
                curlArgs[m[3]].push(m[4])

        @createPawRequest(context, curlArgs, string)

        return true

    return

cURLImporter.identifier = "com.luckymarmot.PawExtensions.cURLImporter"
cURLImporter.title = "cURL Importer"

registerImporter cURLImporter
