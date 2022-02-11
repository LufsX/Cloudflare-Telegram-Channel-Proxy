// 你需要反代的 Channel 的 username
const USERNAME = 'lufsxchannel'
// 访问这个 worker 的 URL，可以是初始的 .workers.dev 的域名。注意不是你想要嵌入到的网页的地址
const BASE_URL = '//t.isteed.cc'
// 在这里你还可以注入一些 CSS 和需要的头部信息
const ICON = '<link rel="icon" type="image/webp" href="https://cdn.isteed.cc/favicon/favicon-32x32.webp"/>' +
             '<base target="_blank" />' + 
             `<style>
                div.tgme_header_search {
                  display: none;
                }
                div.tgme_header_info {
                  margin-right: 0 !important;
                }
                div.tgme_footer {
                  display: none;
                }
              </style>`

const CHANNEL_URL = `https://t.me/s/${USERNAME}`

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

async function replaceText(resp){
    let ct = resp.headers.get('content-type')
    console.log(ct)
    if(!ct)return resp
    ct=ct.toLowerCase()
    if(!(ct.includes('text/html')||ct.includes('application/json')))return resp
    let text = await resp.text()
    text=text.replace(/<a class="tgme_channel_join_telegram" href="\/\/telegram\.org\/dl[\?a-z0-9_=]*">/g, 
        `<a class="tgme_channel_join_telegram" href="https://t.me/${USERNAME}">`)
    text=text.replace(/<a class="tgme_channel_download_telegram" href="\/\/telegram\.org\/dl[\?a-z0-9_=]*">/g, 
        `<a class="tgme_channel_download_telegram" href="https://t.me/${USERNAME}">`)
    text=text.replace(/<link rel="shortcut icon" href="\/\/telegram\.org\/favicon\.ico\?\d+" type="image\/x-icon" \/>/g, ICON)
    text=text.replace(/\\?\/\\?\/telegram.org\\?\//g, `${BASE_URL}/tgorg/`)
    text=text.replace(/\\?\/\\?\/cdn(\d).telesco.pe\\?\//g, `${BASE_URL}/ts/$1/`)
    text=text.replace(/t.me\/[A-z0-9\_]{5,}\//g, `${BASE_URL}/`)
    text=text.replace(/<div class="tgme_channel_download_telegram_bottom">to view and join the conversation<\/div>/g, "")
    text=text.replace(/Download Telegram/g, "Join Channel")
    return new Response(text, {
        headers: { "content-type": ct }
    })
}

async function handleRequest(request) {
    var u = new URL(request.url);
    var reg = /\/[0-9]*$/
    // 统计节点
    if(u.pathname==='/v/'){
      return new Response('true',{
        headers: { "content-type": "application/json" }
      })
    }
    // 主页
    if(u.pathname==='/'){
      const req = new Request(CHANNEL_URL, {
        method: 'GET',
      })
      const result = await fetch(req)
      return replaceText(result)
    }
    // 消息定位
    if(reg.test(u.pathname)){
      const req = new Request(CHANNEL_URL+u.pathname, {
        method: 'GET',
      })
      const result = await fetch(req)
      return replaceText(result)
    }
    

    const pathParts = u.pathname.split('/')
    pathParts.shift()
    const host = pathParts.length>0 ? pathParts[0] : ''
    const hostParam = pathParts.length>1 ? pathParts[1] : ''
    // telegram.org 的节点
    if(host==='tgorg'){
      const req = new Request(`https://telegram.org/${pathParts.slice(1).join('/')}`, {
        method: 'GET',
      })
      const result = await fetch(req)
      return result
    }
    // telescope 的节点
    if(host==='ts'){
      const req = new Request(`https://cdn${hostParam}.telesco.pe/${pathParts.slice(2).join('/')}`, {
        method: 'GET',
      })
      const result = await fetch(req)
      return result
    }
    // 加载更多
    if(host==='s'&&hostParam===USERNAME){
        u.host = 't.me'
        const req = new Request(u, {
            method: 'POST',
            headers: {'X-Requested-With': 'XMLHttpRequest'}
        });
        const result = await fetch(req);
        return replaceText(result)
    }

    return await fetch(new Request('https://t.isteed.cc',{
        method: request.method,
        headers: request.headers,
        body: request.body
    }))
}
