

export const baton = (state, show, baseEl = null) => {
  const lifecycles = new Map()
  let reflectionScheduled = false

  if ((state === null || typeof state === "undefined")) {
    throw new Error("`state' is out of range")
  }
  if (! baseEl) {
    if (! document) {
      throw new Error("`baseEl' is required")
    }
    baseEl = document.documentElement
  }

  const declType = (name, value) => {
    if (name[0] === '&') {
      return "observer"
    } else if ((value !== null && !Array.isArray(value) && typeof value == "object") || 
               (typeof value == "function" && !(name[0] == 'o' && name[1] == 'n') && name[0] != '&')) {
      return "element"
    } else {
      return "property"
    }
  }

  const collectKeys = (parent) => {
    const keys = []
    for (let c = parent.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === c.ELEMENT_NODE && c.hasAttribute("data-baton-key")) {
        keys.push(c.getAttribute("data-baton-key"))
      }
    }
    return keys
  }

  const dispatchElement = (decls, el) => {
    const callbacks = []
    
    // sync properties from declaration to element.
    for (let name in decls) {
      let value = decls[name]
      if (declType(name, value) === "property") {
        value = dispatchProperty(name, value, el, decls)
        // handles update observer
        const observerName = "&" + name
        if (decls[observerName]) {
          if (! el.batonCache) {
            el.batonCache = {}
          }
          if (name in el.batonCache) {
            // TODO: we should obtain oldValue even if el.batonCache[name] is missing.
            const oldValue = el.batonCache[name]
            if (oldValue !== value) {
              callbacks.push([decls[observerName], el, name, value, oldValue, null])
            }
          }
          el.batonCache[name] = value
        }
        // The following properties are always stored on cache: on*, childKeys, childTemplate
        if ((name[0] === 'o' && name[1] === 'n') || name === "childKeys" || name === "childTemplate") {
          if (! el.batonCache) {
            el.batonCache = {}
          }
          el.batonCache[name] = value
        }
      }
    }
    // call update observers
    for (let callback of callbacks) {
      const f = callback.shift()
      f(...callback)
    }
    // handles `mounted' callback
    if ("&mounted" in decls) {
      // If the declaration is a function, the declaration cannot be referenced 
      // because the corresponding element does not exist when unmounted.
      // Therefore, `mounted' callback should be stored in the element so that 
      // it can be referenced even when there is no declaration.
      el.batonLifecycle = decls["&mounted"]
      if (lifecycles.get(el) === true) {
        el.batonLifecycle(el, "mounted", true, false, null)
        lifecycles.delete(el)
      }
    }
    // dispatch sub declarations
    for (let name in decls) {
      const value = decls[name]
      if (declType(name, value) === "element") {
        const subEls = el.querySelectorAll(name)
        let i = 0
        for (let subEl of subEls) {
          if (subEl.batonUnmounted) {
            // subEl has been already unmounted. Just ignore.
            continue
          } else if (lifecycles.get(subEl) === false) {
            // subEl is just being unmounted. Unmount now.
            subEl.batonUnmounted = true
            const cleanup = () => {
              subEl.parentNode.removeChild(subEl)
              delete subEl.batonUnmounted
            }
            if (subEl.batonLifecycle) {
              subEl.batonLifecycle(subEl, "mounted", false, true, cleanup)
            } else {
              cleanup()
            }
            lifecycles.delete(subEl)
            continue
          }
          const subDecls = (typeof value == "function") ? value(subEl, i) : value
          dispatchElement(subDecls, subEl)
          i++
        }
      }
    }
  }

  const dispatchProperty = (name, value, el, decls) => {
    if (name[0] == 'o' && name[1] == 'n') {  // case: event handler
      const eventType = name.slice(2)
      if (el.batonCache && el.batonCache[name]) {
        if (el.batonCache[name] !== value) {
          // handler changed
          el.removeEventListener(eventType, el.batonEhcache[name])
          el.addEventListener(eventType, value)
        }
      } else {
        // new handler
        el.addEventListener(eventType, value)
      }
    }
    else if (name[0] == '&') {  // case: update handler
      // we just ignore it
    }
    else if (name === 'childKeys') {  // case: childKeys special attribute
      const newKeys = value
      const keyToEl = {}
      for (let c of el.childNodes) {
        if (c.nodeType === c.ELEMENT_NODE && c.hasAttribute('data-baton-key') && c.getAttribute('data-baton-key')) {
          keyToEl[c.getAttribute('data-baton-key')] = c
        }
      }
      const oldKeys = (el.batonCache && el.batonCache.childKeys) ? el.batonCache.childKeys : collectKeys(el)
      for (let ev of diff(newKeys, oldKeys)) {
        switch (ev.type) {
          case 'insert': {
            const template = decls["childTemplate"]
            const c = (template.constructor.name === "HTMLTemplateElement") ? template.content.firstElementChild.cloneNode(true)
                    : template.cloneNode(true)
            c.setAttribute('data-baton-key', ev.key)
            delete c.batonUnmounted
            const prev = ev.afterKey ? keyToEl[ev.afterKey] : null
            el.insertBefore(c, prev ? prev.nextSibling : el.childNodes[0])
            lifecycles.set(c, true)
            keyToEl[ev.key] = c
            break
          }
          case 'move': {
            const c = keyToEl[ev.key]
            const prev = ev.afterKey ? keyToEl[ev.afterKey] : null
            el.insertBefore(c, prev ? prev.nextSibling : el.childNodes[0])
            break
          }
          case 'remove': {
            const c = keyToEl[ev.key]
            lifecycles.set(c, false)
            break
          }
        }
      }
    }
    else if (name === "childTemplate") {  // case: childTemplate special

    }
    else if (name[0] == 'd' && name[1] == 'a' && name[2] == 't' && name[3] == 'a' && name[4] == '-') {  // case: dataset
      value = "" + value
      if (value === "") el.removeAttribute(name) 
      else el.setAttribute(name, value)
    }
    else if (name[0] == 'c' && name[1] == 'l' && name[2] == 'a' && name[3] == 's' && name[4] == 's' && name[5] == '-') {  // case: css class
      const cname = name.slice(6)
      if (value) el.classList.add(cname)
      else el.classList.remove(cname)
    }
    else if (name[0] == 's' && name[1] == 't' && name[2] == 'y' && name[3] == 'l' && name[4] == 'e' && name[5] == '-') {  // case: style
      const sname = name.slice(6)
      value = "" + value
      if (value === "" || value === null) el.style.removeProperty(sname)
      else el.style.setProperty(sname, value)
    }
    else {  // otherwise: common attributes
      if (name in el) {
        value = value == null ? "" : value
        el[name] = value
      } else {
        if (value != null && value !== false) el.setAttribute(name, value)
        else el.removeAttribute(name)
      }
    }
    return value
  }

  const reflect = () => {
    reflectionScheduled = false
    
    const decls0 = show(state)
    const decls = (typeof decls0 === 'function') ? decls0(baseEl, 0) : decls0
    dispatchElement(decls, baseEl)
    
    // There may be elements without UI declarations. We process them here.
    lifecycles.forEach((lifecycle, el) => {
      if (! lifecycle) {
        el.parentNode.removeChild(el)
      }
    })
    lifecycles.clear()
  }

  const scheduleReflection = () => {
    if (! reflectionScheduled) {
      setTimeout(reflect)
      reflectionScheduled = true
    }
  }

  const withState = (update) => {
    const state0 = update(state)
    if ((state0 !== null && typeof state0 !== "undefined") && state0 !== state) {
      state = state0
      scheduleReflection()
    }
  }

  scheduleReflection()

  return withState
}

export const diff = (newKeys, oldKeys) => {
  let oldKeyed = {}
  for (let i = 0; i < oldKeys.length; i++) {
    oldKeyed[oldKeys[i]] = i
  }

  const events = []
  let newKeyed = {}
  let i = 0
  let k = 0
  while (k < newKeys.length) {
    let oldKey = oldKeys[i]
    let newKey = newKeys[k]
    if (oldKey in newKeyed) {
      i++
      continue
    }
    if (newKey === oldKeys[i + 1]) {
      i++
      continue
    }
    let keyedIndex = (newKey in oldKeyed) ? oldKeyed[newKey] : null
    if (oldKey === newKey) {
      // match
      i++
    } else if (keyedIndex !== null) {
      // move
      const beforeKey = (k > 0) ? newKeys[k - 1] : null
      events.push({type:'move', key:newKey, afterKey:beforeKey})
    } else {
      // insert
      const beforeKey = (k > 0) ? newKeys[k - 1] : null
      events.push({type:'insert', key:newKey, afterKey:beforeKey})
    }
    newKeyed[newKey] = k
    k++
  }
  for (let oldKey in oldKeyed) {
    if (!(oldKey in newKeyed)) {
      events.push({type:'remove', key:oldKey})
    }
  }

  return events
}

const presetOptions = {
  details: {
    target: ':scope > *:nth-child(2)', 
    onstart: (el, name, newValue, oldValue) => {
      const p = el.querySelector(':scope > *:nth-child(2)')
      if (! newValue) {
        el.open = true
      }
      const rect = p.getBoundingClientRect()
      p.style.setProperty("--width", rect.width + "px")
      p.style.setProperty("--height", rect.height + "px")
    }, 
    onfinish: (el, name, newValue, oldValue) => {
      if (! newValue) {
        el.open = false
      }
    }
  }, 
  size: {
    onstart: (el, name, newValue, oldValue) => {
      const rect = el.getBoundingClientRect()
      el.style.setProperty("--width", rect.width + "px")
      el.style.setProperty("--height", rect.height + "px")
    }
  }, 
  dropdown: {
    onstart: (el, name, newValue, oldValue) => {
      const rect = el.getBoundingClientRect()
      el.style.setProperty("--width", rect.width + "px")
      el.style.setProperty('--height', rect.height + 'px')
      if (newValue) {
        const callerEl = document.getElementById(newValue)
        const callerRect = callerEl.getBoundingClientRect()
        const ww = document.documentElement.clientWidth  // TODO: is this correct?
        const wh = window.innerHeight  // TODO: is this correct?
        let left, right, top, bottom
        if (callerRect.left + rect.width <= ww) {
          left = callerRect.left + "px"
          right = "auto"
        } else if (callerRect.right - rect.width >= 0) {
          left = "auto"
          right = (ww - callerRect.right) + "px"
        } else {
          left = ((ww - rect.width) * 0.5) + "px"
          right = "auto"
        }
        if (callerRect.bottom + rect.height <= wh) {
          top = callerRect.bottom + "px"
          bottom = "auto"
        } else if (callerRect.bottom - rect.height >= 0) {
          top = "auto"
          bottom = (wh - callerRect.top) + "px"
        } else {
          top = ((wh - rect.height) * 0.5) + "px"
          bottom = "auto"
        }
        el.style.setProperty('--left', left)
        el.style.setProperty('--right', right)
        el.style.setProperty('--top', top)
        el.style.setProperty('--bottom', bottom)
      }
    }
  }
}

/**
 * options.target: css-selector
 * options.onstart: callback
 * options.onfinish: callback
 * options.timeout: number
 */
export const cssTransition = (baseClass, options = {}) => {
  if (typeof options === "string") {
    if (options in presetOptions) {
      options = presetOptions[options]
    } else {
      throw new Error(`unknown preset "${options}"`)
    }
  }
  return (el, name, value, oldValue, cleanup) => {
    const targetEl = (options.target) ? el.querySelector(options.target) : el
    const action = (value) ? 'enter' : 'exit'
    el.classList.add(`${baseClass}-${action}-before`)
    if (options.onstart) options.onstart(el, name, value, oldValue)
    el.classList.remove(`${baseClass}-${action}-before`)
    el.classList.add(`${baseClass}-${action}`)
    let finished = false
    const finish = (ev) => {
      if (ev && ev.target !== targetEl) return
      if (finished) return
      finished = true
      el.classList.remove(`${baseClass}-${action}-active`)
      el.classList.remove(`${baseClass}-${action}`)
      targetEl.removeEventListener('transitionend', finish)
      if (options.onfinish) options.onfinish(el, name, value, oldValue)
      if (cleanup) cleanup()
    }
    window.setTimeout(() => {
      el.classList.add(`${baseClass}-${action}-active`)
      targetEl.addEventListener('transitionend', finish)
      window.setTimeout(finish, options.timeout || 10000)
    }, 100)
  }
}

export const throttle = (fn, interval) => {
  let timerId = null
  let latestArgs = null
  let needInvoke = false
  return (...args) => {
    latestArgs = args
    needInvoke = true
    if (! timerId) {
      const invokeIfNeeded = () => {
        if (needInvoke) {
          fn(...latestArgs)
          latestArgs = null
          needInvoke = false
          timerId = setTimeout(invokeIfNeeded, interval)
        } else {
          timerId = null
        }
      }
      invokeIfNeeded()
    }
  }
}

export const debounce = (fn, delay) => {
  let timerId = null
  return (...args) => {
    if (timerId) {
      clearTimeout(timerId)
    }
    timerId = setTimeout(() => {
      timerId = null
      fn(...args)
    }, delay);
  }
}

export const typeOf = (x) => {
  if (x === null) return "null"
  else if (Array.isArray(x)) return "array"
  else return (typeof x)
}

export const insert = (key, value, vs) => {
  switch (typeOf(vs)) {
    case 'array': {
      const rv = vs.concat()
      if (key < 0 || key > rv.length) throw new Error(`key: out of range (${key})`)
      rv.splice(key, 0, value)
      return rv
    }
    case 'object': {
      const rv = Object.assign({}, vs)
      if (key in rv) throw new Error(`key: out of range (${key})`)
      rv[key] = value
      return rv
    }
    default: 
      throw new Error("`vs': unknown value")
  }
}

export const remove = (key, vs) => {
  switch (typeOf(vs)) {
    case 'array': {
      const rv = vs.concat()
      if (key < 0 || key >= rv.length) throw new Error(`key: out of range (${key})`)
      rv.splice(key, 1)
      return rv
    }
    case 'object': {
      const rv = Object.assign({}, vs)
      if (! (key in rv)) throw new Error(`key: out of range (${key})`)
      delete rv[key]
      return rv
    }
    default: 
      throw new Error("`vs': unknown value")
  }
}

export const update = (...args) => {
  const vs = args.at(-1)
  switch (typeOf(vs)) {
    case 'array': {
      const rv = vs.concat()
      for (let i = 0; i < args.length - 1; i += 2) {
        const key = args[i]
        const value = args[i + 1]
        if (key < 0 || key >= rv.length) throw new Error(`key: out of range (${key})`)
        rv[key] = value
      }
      return rv
    }
    case 'object': {
      const rv = Object.assign({}, vs)
      for (let i = 0; i < args.length - 1; i += 2) {
        const key = args[i]
        const value = args[i + 1]
        if (! (key in rv)) throw new Error(`key: out of range (${key})`)
        rv[key] = value
      }
      return rv
    }
    default: 
      throw new Error("`vs': unknown value")
  }
}

export const sort = (compare, vs) => {
  if (typeOf(vs) !== "array") throw new Error(`vs': unknown value`)
  const rv = [].concat(vs)
  rv.sort(compare)
  return rv
}