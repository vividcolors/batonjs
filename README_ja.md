
# baton.js

導入しやすく協調的な、Web向け宣言型UIフレームワーク。

## 特徴

- 導入しやすい：Node.js、webpack、Babel等のツールは不要。CDNでロードするだけで始められます
- 協調的：DOMを専有しないので、HTMLを出力するPHPやDOM要素を直接変更するjQueryなどと共存できます
- ワンストップ：他のライブラリは不要。これだけで宣言的にUIの状態を管理できます
- 学びやすい：Web標準の上に独自の概念を少し付け足しただけなので、少しの学習ですぐに使えるようになります
- 保守しやすい：枠組みに沿って書けば自然とコードが整理されるので、保守がしやすくなります

## 概要

簡単なクリックカウントを例に、baton.jsを見てみましょう。

```html:html
<html>
  <body>
    <p>Count: <span id="count">0</span></p>
    <button id="button" type="button">Count Up</button>
  </body>
</html>
```

baton.jsは既存のHTMLページにUI管理を後付けします。だからこの例でもHTMLは完全な形になっています。  
#countの中のテキストがカウントアップされていきます。カウントアップするには#buttonをクリックします。

```javascript:javascript
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

2行目でページの初期状態を定義しています。このオブジェクトは13行目でbatonを起動するのに使われます。  
3行目の`show`関数は、状態をUIに反映させる方法を指示する関数です。最新のページ状態を受け取り、それを __UI宣言__ に変換して返却します。UI宣言とは、どのUIがどうであるべきかを表現したオブジェクトです。 
5行目の`#counter`はCSSセレクターです。  
6行目では`innerText`プロパティがカウント数になるようにしています。5行目と6行目で、どのDOM要素のどのプロパティをどんな値にするか、を指示できていることに注目してください。  
11行目の`withState`は、ページ状態を更新するための関数です。`withState`にコールバック関数を渡すとそれはすぐに呼び出されます。コールバック関数では状態を更新して返します。そうすると、UIへの反映までをすべてbaton.jsがやってくれます。もちろん、その過程で`show`関数も使われます。  
13行目ではbaton.jsを起動しています。baton.jsを起動すると、引数で渡した状態を管理するための`withState`が返却されます。

この例は、このリポジトリのsamples/sample1.htmlに、実際に動くものがあります。

### ページ状態

ページ状態は1つのjavascriptの値で表現してください。ただし、`null`と`undefined`は使えません。オブジェクトを使うのが普通です。  
baton.jsはページ状態を一切変更しません。

`withState`は普通、イベントハンドラーの中で使います。  
ユーザーがUIを操作してイベントが発生し、そのハンドラーの中で`withState`を使ってページ状態を更新する、という流れです。

`withState`に渡すコールバック関数は、ページ状態を更新して返却します。  
このとき、ページ状態を更新するには、元の値とは別の値（`===`の意味で）を返却してください。baton.jsは`===`でページ状態が変わったかどうかを判断します。つまり、`state.count++`のような代入（破壊的更新）を使うことはできないということです。  
また、返却値が`null`か`undefined`だった場合も、ページ状態は変わっていないとbaton.jsは判断します。


### UI宣言

baton.jsは`querySelectorAll`でDOM要素を抽出します。
要素宣言とプロパティ宣言。
プロパティ宣言にどんなものが書けるか。data-*とか
CSSセレクターのMDNへのリンク。:scopeにも触れる。

__TODO__

### baton.jsの起動

`baton`関数でbaton.jsを起動します。  
最初の引数はページの初期状態です。  
2番目の引数は`show`関数です。  
3番目の引数は任意のDOM要素で、baton.jsが管理するUIの起点となる要素です。UI宣言では、CSSセレクターを使ってDOM要素を抽出しますが、その抽出の起点をここで指定しています。  
なお、この引数は省略可能で、省略した場合は文書全体になります。

## インストール

### CDNから

__TODO__

baton.jsはCDNから読み込むのがおすすめです。インストールは不要です。  
あらかじめCDNからダウンロードしておき、自サーバーに配置することもできます。

### npmから

__TODO__

npmでインストールすれば、バンドルしたりTree Shakingしたりする余地があります。

## 機能と仕様

ここで紹介する機能の __動くサンプル__ が、samplesフォルダ __TODO__ にあります。併せて見てみてください。

### イベントハンドラをUI宣言の中に書く

`addEventListener`を使う代わりに、UI宣言の中でイベントハンドラを設定することができます。プロパティ名は`onclick`、`onchange`など、イベントタイプの前にonを添えてください。

例

```javascript
onclick: countUp
```

そのプロパティ名にも関わらず、baton.jsは内部的には`addEventLister`、`removeEventListener`を使います。

注意：UI宣言の中に関数式（`function () {...}`など）を書くと、`show`関数が呼ばれる度に関数オブジェクトが作成されることになります。これは大抵の場合は非効率ですので、イベントハンドラ関数はグローバルに宣言するのが良いです。

### UI宣言を入れ子にする

UI宣言を入れ子にすることができます。  
その場合、仮に外側の宣言を親、内側を子と呼ぶことにすると、親のCSSセレクターで抽出された要素を起点として、子のCSSセレクターが使われるようになります。

例

```javascript
".parent": {
  ".child": {...}, 
  "data-index": ...
}
```

上の例では、CSSセレクター`.parent .child`と同じDOM要素が抽出されます。  
また、入れ子になった要素の宣言（`.child`）と、プロパティの宣言（`data-index`）を並べられる点にも注目してください。

### UI宣言の中でDOM要素を使う

要素宣言の右辺（左辺のCSSセレクターに対応するブロックの部分）を関数にすることができます。  
ここを関数にすると、CSSセレクターで抽出された各DOM要素を引数としてその関数が呼び出されるようになります。

例

```javascript
"option": (element, index) => ({
  selected: state.selection === element.value
})
```

### `class-*`プロパティ、`style-*`プロパティ

プロパティ宣言にはclass属性とstyle属性のための便利な記法があります。

プロパティ名の先頭が`class-`の場合、これは単一のCSSクラスの指定と解釈されます。プロパティの値は真偽値です。  
たとえば、`"class-is-open": true`という宣言は、感覚的には`classList.add("is-open")`と同じです。逆に、`"class-is-open": false`とすると`classList.remove("is-open")`になります。

同様に、プロパティ名の先頭が`style-`の場合、これは単一のCSSスタイルの指定と解釈されます。プロパティの値は文字列です。  
たとえば、`"style-font-size": "16px"`という宣言は、感覚的にはstyle属性の中に`font-size: 16px;`と書くのと同じです。

注意

- `style-*`プロパティの値に数値を設定しないよう注意してください。悪い例：`"style-font-size": 16`。これは誤作動の原因になるかもしれません
- `class-*`と`class`を併用した場合、`style-*`と`style`を併用した場合の挙動は不明です。そのような使い方はしないでください。HTML上で`class`属性や`style`属性を使うのは構いません

### プロパティの更新監視

DOM要素のプロパティ値が変わったときにコールバック関数を呼んでもらうことができます。baton.jsではこれを更新監視と呼んでいます。  
更新監視はUI宣言の中に書きます。監視対象とするプロパティの名前の前に"&"を付けたものを左辺とし、右辺にはコールバック関数を書きます。

例

```javascript
{
  "class-is-open": state.modalOpen, 
  "&class-is-open": handleModalOpen
}
```

注意：更新監視はbaton.jsがプロパティ値を更新した場合にのみ作動します。baton.jsの外部から変更しても作動しませんので注意してください。

「ページ状態を自分で変更してそれを自分でUIに反映したのに、その変更を教えてもらう？それに何の価値があるの？」と思った方もいるかもしれません。  
実は、これには大きな価値があります。それは、プログラムコードの分割です。

更新監視は、アニメーションを起動したり、bootstrapなど外部のライブラリの部品を起動したり、といった処理に使えます。  
こういった処理は、ページ状態を管理するという視点からみると、脇道のように余計なものです。  
こういった処理をページ状態の管理から分離することを可能にするのが、更新管理の存在意義です。

### CSSトランジションの起動

更新監視の仕組みを使ってCSSトランジションを起動することができます。  

例

```javascript
const fade = cssTransition("fade")
...
{
  "class-is-open": state.modalOpen, 
  "&class-is-open": fade
}
```

```css
.modal.is-open {
  display: block;
  opacity: 1;
}
.modal.transition-enter {
  opacity: 0;
  display: block;
}
.modal.transition-enter-active {
  transition: opacity 0.2s;
  opacity: 1;
}
.modal.transition-exit {
  display: block;
}
.modal.transition-exit-active {
  transition: opacity 0.2s;
  opacity: 0;
}
```

`cssTransition`関数は、要素にCSSトランジションを適用する関数を返却する関数です（`cssTransition`を呼び出した結果が関数になっている）。  
上記のようなモーダルウィンドウの開閉だけでなく、details/summaryの開閉やポップアップの開閉などにも対応しています。

### DOM要素の追加と削除

baton.jsはDOM要素の追加と削除を行えます。そうするには、どのDOM要素の子要素を管理するかを、baton.jsに指示します。  
ここでは、追加および削除されるDOM要素を「子」、その親のDOM要素を「親」と呼ぶことにします。

子要素の追加と削除は、親要素の`children`プロパティを定義することで指示します。
`children`プロパティの値は2要素の配列で、1番目の項目は __子要素のキーの配列__ で、2番目の項目は __子要素を作るためのテンプレートとなる要素__ です。  
キーは子を特定するための文字列で、不変でなければならず、兄弟の中で重複があってもなりません。baton.jsはキーを各子要素の`data-baton-key`属性に保存します。

例

```javascript
{
  children: [state.todos.map(todo => todo.id), document.getElementById('todo-template')]
}
```

baton.jsはキーの配列から子要素の正しい順番を認識し、DOM上でも子がその通りに並ぶように追加・削除と並べ替えを行います。  

注意：HTML上にあらかじめ子が記述されている場合は、`data-baton-key`属性を必ず書くようにしてください

### ライフサイクルの更新監視

更新監視の仕組みを使って、子要素のライフサイクルの変化を監視できます。  
そうするには、子要素の`mounted`仮想プロパティに更新監視を仕掛けてください。

例

```javascript
{
  "&mounted": cssTransition("transition", "height")
}
```

上の例では、追加・削除のタイミングで子要素にCSSトランジションを適用しています。  
より厳密には、`mounted`仮想プロパティはその子要素がbaton.jsの管理下にあるなら`true`で、管理下から外れているときは`false`です。baton.jsの管理下には無いが、DOMツリー上には存在するタイミングがあります（そうでないとCSSトランジションできませんね）。注意してください。

注意

- `mounted`仮想プロパティは仮想的なもので実際には存在しないので、そのプロパティにアクセスすることはできません。できるのは更新の検知だけです
- `mounted`仮想プロパティが使えるのは __親子の子だけ__ です。他の要素にはこの仮想プロパティはありません

## ライセンス

MIT
