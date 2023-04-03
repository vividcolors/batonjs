
# batonjs

導入しやすく協調的な、Web向け宣言型UIフレームワーク。

## 特徴

- 導入しやすい：Node.js、webpack、Babel等のツールは不要。CDNでロードするだけで始められます
- 協調的：DOMを専有しないので、HTMLを出力するPHPやDOM要素を直接変更するjQueryなどと共存できます
- ワンストップ：他のライブラリは不要。これだけで宣言的にUIの状態を管理できます
- 学びやすい：Web標準の上に独自の概念を少し付け足しただけなので、少しの学習ですぐに使えるようになります
- 保守しやすい：枠組みに沿って書けば自然とコードが整理されるので、保守がしやすくなります

## 概要

簡単なクリックカウントを例に、batonjsを見てみましょう。  

```html
<html>
  <body>
    <p>Count: <span id="count">0</span></p>
    <button id="button" type="button">Count Up</button>
  </body>
</html>
```

batonjsは既存のHTMLページにUI管理を後付けします。だからこの例でもHTMLは完全な形になっています。  

```javascript
import {baton} from '../baton.js'
const state = {count:0}
function show(state) {
  return {
    "#counter": {
      innerText: state.count
    }
  }
}
document.getElementById('button').addEventListener('click', (ev) => {
  withState(state => ({count: state.count + 1}))
})
const withState = baton(state, show, document.body)
```

2行目でページの初期状態を定義しています。このオブジェクトは13行目でbatonを起動するのに使います。

3行目の`show`関数は、ページ状態をUIに反映させる方法を指示する関数です。最新のページ状態を受け取り、それを __UI宣言__ に変換して返却します。UI宣言とは、どのUIがどうであるべきかを表現したオブジェクトです。  
5行目の`#counter`はCSSセレクターで、6行目の`innerText`はDOM要素のプロパティ名です。この2行で、どのDOM要素のどのプロパティをどんな値にするか、を確かに指示できていますね。

11行目の`withState`はページ状態を更新するための関数です。`withState`に渡したコールバック関数が新しいページ状態を返却すると、`withState`はその状態をUIに反映させます。もちろん、その過程で`show`関数が使われます。

13行目ではbatonjsを起動しています。batonjsを起動すると、状態を管理するための`withState`が返却されます。

この例は、このリポジトリのsamples/sample1.htmlに実際に動くものがあります。samplesディレクトリには他にもたくさんの動くサンプルがあります。

### もっと知るには

batonjsには、プロパティの更新監視、CSSトランジションのサポート、DOM要素の追加・削除およびライフサイクルの管理など、様々な機能があります。  
そのような機能を組み合わせることで、UIのアニメーションや他ライブラリとの連携といった雑多な処理をページの状態管理の核心部分から切り離すことができます。

詳細は、[公式ドキュメント](https://batonjs.com/doc/)を参照してください。

## インストール

### CDNから

batonjsはCDNから読み込むのがおすすめです。インストールは不要です。  
あらかじめCDNからダウンロードしておき、自サーバーに配置することもできます。

ESモジュール形式 __TODO URL__

```
<script type="module">
import {baton} from '../dist/baton.esm.js'
</script>
```

UMD形式 __TODO URL__
```
<script src="../dist/baton.umd.js"></script>
<script>
const baton = batonjs.baton
</script>
```

### npmから

npmでインストールすれば、バンドルしたりTree Shakingしたりする余地があります。

__TODO PACKAGE NAME__
```shell
$ npm install batonjs
```

ESモジュール形式
```javascript
import {baton} from 'batonjs'
```

CommonJS形式
```javascript
const {baton} = require('batonjs')
```

## 動作環境

Chrome、Edge、Firefox、Chrome for Android、iOS Safari各最新版。  
Node.js v14以上。

## ライセンス

MIT
