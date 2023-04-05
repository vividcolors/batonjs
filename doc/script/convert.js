import {baton} from '../../src/baton.js'
import { readFile, writeFile, opendir, copyFile, stat, mkdir } from 'node:fs/promises'
import { JSDOM } from 'jsdom'
import path from 'path'
import { fileURLToPath } from 'url'
import cpx from 'cpx'

const show = (config) => {
  return {
    title: (el) => ({innerHTML: el.innerHTML + ' | ' + config.siteTitle}), 
    head: (el) => ({innerHTML: el.innerHTML + config.head}), 
    "#header": {innerHTML: config.header}, 
    "#sidebar": {innerHTML: config.sidebar}, 
    "#footer": {innerHTML: config.footer}, 
    "#toc": {innerHTML: config.toc}
  }
}

const buildToc = (lang, dom, config) => {
  const ul = config.window.document.documentElement.querySelector(`.toc.${lang}`).content.firstElementChild.cloneNode(true)
  const hds = dom.window.document.querySelectorAll('h2[id]')
  const document = dom.window.document
  for (let hd of hds) {
    const li = document.createElement('li')
    const a = document.createElement('a')
    a.href = "#" + hd.id
    a.textContent = hd.textContent
    li.appendChild(a)
    ul.appendChild(li)
  }
  return ul.outerHTML
}

const checkUpdated = (document) => {
  return new Promise(resolve => {
    const check = () => {
      if (document.querySelector("#header").children.length) {
        resolve()
      } else {
        setTimeout(check, 100)
      }
    }
    setTimeout(check)
  })
}

const checkDir = async (path) => {
  await stat(path).catch(() => {
    mkdir(path)
  })
}

const run1 = async (lang, config, inPath, outPath) => {
  const dom = await readFile(inPath).then(str => (new JSDOM(str)))

  const state =  {
    siteTitle: config.window.document.documentElement.querySelector(`.site-title.${lang}`).innerHTML, 
    head: config.window.document.documentElement.querySelector(`.head.${lang}`).innerHTML, 
    header: config.window.document.documentElement.querySelector(`.header.${lang}`).innerHTML, 
    sidebar: config.window.document.documentElement.querySelector(`.sidebar.${lang}`).innerHTML, 
    footer: config.window.document.documentElement.querySelector(`.footer.${lang}`).innerHTML, 
    toc: buildToc(lang, dom, config)
  }
  baton(state, show, dom.window.document)
  await checkUpdated(dom.window.document)

  const output = dom.serialize()
  console.log('out: ', outPath)
  await writeFile(outPath, output)
}

const runDir = async (lang, config, inDirPath, outDirPath) => {
  for await (let e of await opendir(inDirPath)) {
    const inPath = path.join(inDirPath, e.name)
    const outPath = path.join(outDirPath, e.name)
    if (e.isDirectory()) {
      checkDir(outPath)
      await runDir(lang, config, inPath, outPath)
    } else if (inPath.endsWith('.html')) {
      await run1(lang, config, inPath, outPath)
    } else {
      await copyFile(inPath, outPath)
    }
  }
}

const run = async () => {
  const docPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
  const configPath = path.join(docPath, 'config.html')
  const config = await readFile(configPath).then(str => (new JSDOM(str)))

  const inDirPathJa = path.join(docPath, "src/ja")
  const outDirPathJa = path.join(docPath, "dist/ja")
  checkDir(outDirPathJa)
  await runDir("ja", config, inDirPathJa, outDirPathJa)
  
  const inDirPathEn = path.join(docPath, "src/en")
  const outDirPathEn = path.join(docPath, "dist/en")
  checkDir(outDirPathEn)
  await runDir("en", config, inDirPathEn, outDirPathEn)

  const inDirPathAsset = path.join(docPath, "src/asset")
  const outDirPathAsset = path.join(docPath, "dist/asset")
  checkDir(outDirPathAsset)
  await runDir("en", config, inDirPathAsset, outDirPathAsset)
}

const copySamples = () => {
  const srcPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../samples/sample*")
  const dstPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "../dist/samples")
  cpx.copySync(srcPath, dstPath)
}

const copyBaton = () => {
  const srcPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../asset/*")
  const dstPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "../dist/asset")
  cpx.copySync(srcPath, dstPath)
}

await run()
copySamples()
copyBaton()