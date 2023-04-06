# batonjs

Declarative UI framework for Web that is easy to introduce and collaborative

- Easy to introduce: You don't need to use either Node.js, webpack or Babel, etc. Just load from CDN to get started
- Collaborative: It does not occupy DOM, so it can coexist with other libraries such as jQuery
- One-stop: You don't need any other libraries. This is all you need to declaratively manage UI state
- Easy to learn: You have less learning because we only add a few of our own concepts on top of the web standards
- Maintenable: Your code will be easier to maintain because it will be naturally organized if you code according to the framework

## Overview

Let's look at batonjs with a simple click-counting example.

```html
<html>
  <body>
    <p>Count: <span id="count">0</span></p>
    <button id="button" type="button">Count Up</button>
  </body>
</html>
```

batonjs retrofits UI management to an existing HTML page. So even in this example the HTML is in its complete form.

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

At line 2, the initial state of the page is defined. This object is used to invoke batonjs in line 13.

The `show` function on line 3 tells batonjs how to reflect the page state in the UI. It takes the latest page state, converts it to a __UI declaration__ and returns it; a UI declaration is an object that represents what the UI should be.  
The `#count` in line 5 is the CSS selector and the `innerText` in line 6 is the property name of the DOM element. These two lines certainly tell which property of which DOM element should have what value.

The `withState` function on line 11 is used to update the page state. When the callback function passed to `withState` returns a new page state, `withState` will reflect that state in the UI. Of course, the `show` function is used in the process.

At line 13, we invoke batonjs, which will return `withState` to manage the state we give it.

There is [a real working example](https://batonjs.com/en/samples.html?no=1) of this example in [the live samples](https://batonjs.com/en/samples.html). There are many more working live samples included in this repository.

### To Lean More

batonjs offers a variety of functionalities, including property update observation, support for CSS transitions, adding/removing DOM elements, and lifecycle management. You can combine these features to create dynamic web pages.

A notable feature of batonjs is that by following the framework, you can separate page state updates, reflections on the UI, and the detailed behavior of the UI.

See [official documentation](https://batonjs.com/en/) for details.

## Installation

### From CDN

Installation of batonjs is not required; loading it from CDN is recommended as it is easier.  
You can also download it from CDN in advance and deploy it on your own server.

ES Module format __TODO URL__
```html
<script type="module">
import {baton} from '../dist/baton.esm.js'
</script>
```

UMD format __TODO URL__
```html
<script src="../dist/baton.umd.js"></script>
<script>
const baton = batonjs.baton
</script>
```

### From npm

If you install with npm, there is room for bundling and tree shaking.

__TODO PACKAGE NAME__
```shell
$ npm install batonjs
```

ES Module format
```javascript
import {baton} from 'batonjs'
```

CommonJS format
```javascript
const {baton} = require('batonjs')
```

## Runtime Requirements

- Chrome, latest
- Edge, latest
- Firefox, latest
- Chrome for Android, latest
- iOS Safari, latest
- Node.js, v14 or greater

## License

MIT
