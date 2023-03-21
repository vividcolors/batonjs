



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
          (name[0] == '@') ||  // virtual properties
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
 * options.target  -- the descendant element which plays the transition.
 * options.stateClass  -- the css class name which will be added/removed after transition.
 * options.steteProp  -- the property name to which will be set after transition.
 */
export const cssTransition = (baseClass, options) => {
  return (el, name, value, oldValue) => {
    const targetEl = (options.target) ? el.querySelector(options.target) : el
    const action = (value) ? 'enter' : 'exit'
    el.classList.add(`${baseClass}-${action}`)
    const cleanup = (ev) => {
      if (ev && ev.target !== targetEl) return
      if (options.stateClass) el.classList[value ? "add" : "remove"](options.stateClass)
      if (options.stateProp) el[options.stateProp] = !!value
      el.classList.remove(`${baseClass}-${action}`)
      el.classList.remove(`${baseClass}-${action}-active`)
      targetEl.removeEventListener('transitionend', cleanup)
    }
    window.setTimeout(() => {
      el.classList.add(`${baseClass}-${action}-active`)
      targetEl.addEventListener('transitionend', cleanup)
      window.setTimeout(cleanup, 10000)
    }, 100)
  }
}

