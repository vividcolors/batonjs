



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
      if ((value !== null && typeof value == "object") || 
          (typeof value == "function" && !(name[0] == 'o' && name[1] == 'n') && name[0] != '&')) {
        // element declaration
        const subEls = el.querySelectorAll(name)
        for (let i = 0; i < subEls.length; i++) {
          const subEl = subEls[i]
          const subDecls = (typeof value == "function") ? value(subEl, i) : value
          const subProps = {}
          tasks.push({el:subEl, props:subProps})
          collectTasks(subDecls, subEls[i], subProps)
        }
      } else {
        // property declaration
        props[name] = value
      }
    }
  }
  
  const dispatchTasks = () => {
    while (tasks.length) {
      const {el, props} = tasks.shift()
      for (let name in props) {
        let value = props[name]
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
              if (props["&" + name]) {
                props["&" + name](el, name, value, el.batonEhs[eventType])
              }
            }
          } else {
            // new handler
            el.addEventListener(eventType, value)
            el.batonEhs[eventType] = value
            if (props["&" + name]) {
              props["&" + name](el, name, value, null)
            }
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
          value = "" + value
          if (oldValue !== value) {
            if (value === "") el.removeAttribute(name) 
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
        else if (name[0] == 's' && name[1] == 't' && name[2] == 'y' && name[3] == 'l' && name[4] == 'e' && name[5] == '-') {  // case: style
          const sname = name.slice(6)
          const oldValue = el.style.getPropertyValue(sname)
          value = "" + value
          if (oldValue !== value) {
            if (value === "" || value === null) el.style.removeProperty(sname)
            else el.style.setProperty(sname, value)
            if (props["&" + name]) {
              props["&" + name](el, name, value, oldValue)
            }
          }
        }
        else {  // otherwise: common attributes
          if (name in el &&
              name !== "list" &&
              name !== "type" &&
              name !== "draggable" &&
              name !== "spellcheck" &&
              name !== "translate") {
            value = value == null ? "" : value
            const oldValue = el[name]
            if (oldValue !== value) {
              el[name] = value
              if (props["&" + name]) {
                props["&" + name](el, name, value, oldValue)
              }
            }
          } else {
            const oldValue = el.getAttribute(name)
            if (oldValue !== value) {
              if (value != null && value !== false) el.setAttribute(name, value)
              else el.removeAttribute(name)
              if (props["&" + name]) {
                props["&" + name](el, name, value, oldValue)
              }
            }
          }
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
 * options.timeout: number
 */
export const cssTransition = (baseClass, options = {}) => {
  return (el, name, value, oldValue) => {
    const targetEl = (options.target) ? el.querySelector(options.target) : el
    const action = (value) ? 'enter' : 'exit'
    el.classList.add(`${baseClass}-${action}-before`)
    if (options.onstart) options.onstart(el, name, value, oldValue)
    el.classList.remove(`${baseClass}-${action}-before`)
    el.classList.add(`${baseClass}-${action}`)
    let cleaned = false
    const cleanup = (ev) => {
      if (ev && ev.target !== targetEl) return
      if (cleaned) return
      cleaned = true
      el.classList.remove(`${baseClass}-${action}-active`)
      el.classList.remove(`${baseClass}-${action}`)
      targetEl.removeEventListener('transitionend', cleanup)
      if (options.onfinish) options.onfinish(el, name, value, oldValue)
    }
    window.setTimeout(() => {
      el.classList.add(`${baseClass}-${action}-active`)
      targetEl.addEventListener('transitionend', cleanup)
      window.setTimeout(cleanup, options.timeout || 10000)
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