const fs = require('fs')
const http = require('http')
const https = require('https')

const $ = require('cheerio')

let url_page = 'https://sxbb.me/WOuba' // 目标页面
let resultDir = `${__dirname}/result` // 文件保存路径

fsExistsSync(resultDir)

new Promise(resolve => {
  queryPage(url_page, htmlStr => {
    // 取得 iframe 的 dom 节点
    let iframe = $('#iframe', htmlStr)[0]
  
    // 取得资源页路径
    let url_iframe = iframe.attribs.src
  
    resolve(url_iframe)
  })
})
.then(url_iframe => {
  // 抓取文件下载路径以及文件名字，进行下载
  queryPage(url_iframe, htmlStr => {
    let linkArr = Array.from($('li > a', htmlStr)).map(el => {
      let href = el.attribs.onclick.match(/\'(.+)\'/)[1] // 取得文件下载路径
      let name = el.childNodes.find(el => el.type === 'text').data // 取得文件名

      return new Promise(resolve => {
        downloadFile(href, name, _ => {
          console.log(` -- ${name} finish!`)
          resolve()
        })
      })
    })


    Promise
      .all(linkArr)
      .then(_ => {
        console.log('done !')
      })
  })
})

// 访问页面，可在回调函数中做 dom 操作
function queryPage(url, _cb = function() {}) {
  if (/^https/i.test(url)) {
    https.get(url, _loadPage)
  } else {
    http.get(url, _loadPage)
  }
  
  function _loadPage(res) {
    let pageChuncks = []
  
    res.on('data', data => {
      pageChuncks.push(data)
    })
    res.on('end', _ => {
      let htmlStr = pageChuncks.join('')
  
      _cb(htmlStr)
    })
  }
}

// 下载文件，并保存到 /result 路径
function downloadFile(url, filename, _cb = function() {}){
  if (/^https/i.test(url)) {
    https.get(url, _saveFile)
  } else {
    http.get(url, _saveFile)
  }

  function _saveFile(res) {
    let stream = fs.createWriteStream(`${resultDir}/${filename}`)
  
    res.pipe(stream).on('close', _ => {
      _cb()
    })
  }
}

// 检测文件或者文件夹存在
function fsExistsSync(path) {
  try {
    fs.accessSync(path, fs.F_OK)
  } catch (err) {
    if (err.errno === -4058) {
      // 文件夹不存在，创建文件夹
      fs.mkdirSync(path)
    } else {
      // 其他错误，中断程序
      throw err
    }
  }
  return true
}