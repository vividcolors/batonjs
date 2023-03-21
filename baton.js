



export const baton = (state, show, baseEl = null) => {
  const tasks = []  // update tasks for elements; {el, props}[]
  const posttasks = []  // posttask[]; posttask: () => void
  if ((state === null || typeof state === "undefined")) {
    throw new Error("`state' is out of range")
  }
  if (! baseEl) {
    baseEl = document.documentElement
  }

  const collectTasks = (decls, el, props) => {
    for (let name in decls) {
      const value = decls[name]
      if (name == "attributes" || name == "classList" || name == "dataset" || name == "style" ||  // special properties
          (name[0] == 'o' && name[1] == 'n') ||  // event handlers
          (name[0] == 'd' && name[1] == 'a' && name[2] == 't' && name[3] == 'a' && name[4] == '-') ||  // data attributes
          (name[0] == 'c' && name[1] == 'l' && name[2] == 'a' && name[3] == 's' && name[4] == 's' && name[5] == '-') ||  // css class
          (name[0] == '@') ||  // virtual properties
          (name[0] == '&') ||  // update handler
          !((value !== null && typeof value == "object") || typeof value == "function")) {  // they are element declaration
        // property declaration
        props[name] = value
      } else {
        // element declaration
        const subEls = el.querySelectorAll(name)
        for (let i = 0; i < subEls.length; i++) {
          const subEl = subEls[i]
          const subDecls = (typeof value == "function") ? value(subEl, i) : value
          const subProps = {}
          tasks.push({el:subEl, props:subProps})
          collectTasks(subDecls, subEls[i], subProps)
        }
      }
    }
  }
  
  const dispatchTasks = () => {
    while (tasks.length) {
      const {el, props} = tasks.shift()
      for (let name in props) {
        const value = props[name]
        if (name[0] == 'o' && name[1] == 'n') {  // case: event handler
          const eventType = name.slice(2)
          if (! el.batonEhs) {
            el.batonEhs = {}
          }
          if (el.batonEhs[eventType]) {
            if (el.batonEhs[eventType] !== value) {
              // handler changed
              el.removeEventListener(eventType, el.batonEhs[eventType])
              el.addEventListener(eventType, value)
              el.batonEhs[eventType] = value
            }
          } else {
            // new handler
            el.addEventListener(eventType, value)
            el.batonEhs[eventType] = value
          }
        }
        else if (name[0] == '@') {  // case: virtual property
          const dataName = name.slice(1)
          if (! el.batonVirtual) {
            el.batonVirtual = {}
          }
          if (el.batonVirtual.hasOwnProperty(dataName)) {
            const oldValue = el.batonVirtual[dataName]
            if (value !== oldValue) {
              posttasks.push(() => {
                if (el.batonEhs && el.batonEhs[dataName]) {
                  el.batonEhs[dataName](el, dataName, value, oldValue)
                }
              })
            }
          }
          el.batonVirtual[dataName] = value
        }
        else if (name[0] == '&') {  // case: update handler
          // we just ignore it
        }
        else if (name[0] == 'd' && name[1] == 'a' && name[2] == 't' && name[3] == 'a' && name[4] == '-') {  // case: dataset
          const oldValue = el.getAttribute(name)
          if (oldValue !== value) {
            if (value === "" || value === null) el.removeAttribute(name) 
            else el.setAttribute(name, value)
            if (props["&" + name]) {
              props["&" + name](el, name, value, oldValue)
            }
          }
        }
        else if (name[0] == 'c' && name[1] == 'l' && name[2] == 'a' && name[3] == 's' && name[4] == 's' && name[5] == '-') {  // case: css class
          const cname = name.slice(6)
          const contained = el.classList.contains(cname)
          if (value) {
            el.classList.add(cname)
            if (!contained && props["&" + name]) {
              props["&" + name](el, name, true, false)
            }
          } else {
            el.classList.remove(cname)
            if (contained && props["&" + name]) {
              props["&" + name](el, name, false, true)
            }
          }
        }
        else if (name == "classList") {  // case: classList property
          for (let c in value) {
            if (value[c]) {
              el.classList.add(c)
            } else {
              el.classList.remove(c)
            }
          }
        }
        else if (name == "attributes") {  // case: attributes property
          for (let a in value) {
            if (typeof value[a] === "undefined") {
              el.removeAttribute(a)
            } else {
              el.setAttribute(a, value[a])
            }
          }
        }
        else if (value !== null && typeof value == "object") {  // case: object property
          for (let x in value) {
            if (typeof value[x] === "undefined") {
              delete el[name]
            } else {
              el[name][x] = value[x]
            }
          }
        }
        else {  // case: scalar property
          el[name] = value
        }
      }
    }
  }

  const postfix = () => {
    while (posttasks.length) {
      const callback = posttasks.shift()
      callback()
    }
  }

  const reflect = () => {
    const decls = show(state)
    const props = {}
    tasks.push({el:baseEl, props})
    collectTasks(decls, baseEl, props)
    dispatchTasks()
    postfix()
  }

  const withState = (update) => {
    const state0 = update(state)
    if ((state0 !== null && typeof state0 !== "undefined") && state0 !== state) {
      state = state0
      reflect()
    }
  }

  reflect()

  return withState
}

/**
 * options.target: css-selector
 * options.onstart: callback
 * options.onfinish: callback
 */
export const cssTransition = (baseClass, options = {}) => {
  return (el, name, value, oldValue) => {
    if (options.onstart) options.onstart(el, name, value, oldValue)
    const targetEl = (options.target) ? el.querySelector(options.target) : el
    const action = (value) ? 'enter' : 'exit'
    el.classList.add(`${baseClass}-${action}`)
    let cleaned = false
    const cleanup = (ev) => {
      if (ev && ev.target !== targetEl) return
      if (cleaned) return
      cleaned = true
      el.classList.remove(`${baseClass}-${action}`, `${baseClass}-${action}-active`)
      targetEl.removeEventListener('transitionend', cleanup)
      if (options.onfinish) options.onfinish(el, name, value, oldValue)
    }
    window.setTimeout(() => {
      el.classList.add(`${baseClass}-${action}-active`)
      targetEl.addEventListener('transitionend', cleanup)
      window.setTimeout(cleanup, 10000)
    }, 100)
  }
}

export const throttle = (fn, delay) => {
  let timerId = null
  let lastExecTime = 0
  return (...args) => {
    let elapsedTime = performance.now() - lastExecTime
    const execute = () => {
      fn(...args)
      lastExecTime = performance.now()
    }
    if (!timerId) {
      execute()
    }
    if (timerId) {
      clearTimeout(timerId)
    }
    if (elapsedTime > delay) {
      execute()
    } else {
      timerId = setTimeout(execute, delay)
    }
  }
}

export const debounce = (fn, interval) => {
  let timerId = null
  return (...args) => {
    if (timerId) {
      clearTimeout(timerId)
    }
    timerId = setTimeout(() => {
      fn(...args)
    }, interval);
  }
}