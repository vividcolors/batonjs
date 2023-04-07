
# batonjs

導入しやすく協調的な、Web向け宣言型UIフレームワーク

- 導入しやすい：Node.js、webpack、Babel等のツールは不要。CDNでロードするだけで始められます
- 協調的：DOMを専有しないのでjQueryなど他のライブラリと共存できます
- ワンストップ：他のライブラリは不要。これだけで宣言的にUIの状態を管理できます
- 学びやすい：Web標準の上に独自の概念を少し付け足しただけなので、学習が少なく済みます
- 保守しやすい：枠組みに沿って書けば自然とコードが整理されるので、保守がしやすくなります

## 概要

簡単なクリックカウントを例にbatonjsを見てみましょう。  

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
import {baton} from '../asset/baton.esm.js'
const state = {count:0}
function show(state) {
  return {
    "#count": {
      innerText: state.count
    }
  }
}
document.getElementById('button').addEventListener('click', (ev) => {
  withState(state => ({count: state.count + 1}))
})
const withState = baton(state, show, document.body)
```

2行目でページの初期状態を定義しています。このオブジェクトは13行目でbatonjsを起動するのに使います。

3行目の`show`関数は、ページ状態をUIに反映させる方法を指示する関数です。最新のページ状態を受け取り、それを __UI宣言__ に変換して返却します。UI宣言とは、どのUIがどうであるべきかを表現したオブジェクトです。  
5行目の`#count`はCSSセレクターで、6行目の`innerText`はDOM要素のプロパティ名です。この2行で、どのDOM要素のどのプロパティをどんな値にするか、を確かに指示できていますね。

11行目の`withState`はページ状態を更新するための関数です。`withState`に渡したコールバック関数が新しいページ状態を返却すると、`withState`はその状態をUIに反映させます。もちろん、その過程で`show`関数が使われます。

13行目ではbatonjsを起動しています。batonjsを起動すると、状態を管理するための`withState`が返却されます。

この例は、[ライブサンプル](https://batonjs.com/ja/samples.html)に[実際に動くもの](https://batonjs.com/ja/samples.html?no=1)があります。

### もっと知るには

batonjsには、プロパティの更新監視、CSSトランジションのサポート、DOM要素の追加・削除およびライフサイクルの管理など、様々な機能があります。これらの機能を組み合わせて動的なWebページを作れます。

batonjsの特筆すべき点は、フレームワークに従って作っていくことで、ページ状態の更新、UIへの反映、UIの細かな挙動を分離できることにあります。

詳細は[公式ドキュメント](https://batonjs.com/ja/)を参照してください。

## インストール

### CDNから

batonjsはインストールは必須ではありません。CDNから読み込むのが気楽でおすすめです。  
あらかじめCDNからダウンロードしておき、自サーバーに配置することもできます。

ESモジュール形式 __TODO URL__

```html
<script type="module">
import {baton} from '../dist/baton.esm.js'
</script>
```

UMD形式 __TODO URL__

```html
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

- Chrome最新版
- Edge最新版
- Firefox最新版
- Chrome for Android最新版
- iOS Safari最新版
- Node.js v14以上

## ライセンス

MIT
