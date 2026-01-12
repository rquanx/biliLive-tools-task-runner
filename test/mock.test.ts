fetch('http://localhost:15225/test', {
  headers: {
    accept: 'application/json, text/plain, */*',
    'accept-language': 'zh-CN,zh;q=0.9',
    Authorization: 'dev-secret',
    'content-type': 'application/json',
    Referer: 'http://localhost:3000/',
  },
  body: '{"a":1}',
  method: 'POST',
})
