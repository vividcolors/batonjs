

export const baton = (state, show, baseEl = null) => {
  const lifecycles = new Map()

  if ((state === null || typeof state === "undefined")) {
    throw new Error("`state' is out of range")
  }
  if (! baseEl) {
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

  const dispatchElement = (decls, el) => {
    const callbacks = []
    
    // sync properties from declaration to element.
    for (let name in decls) {
      let value = decls[name]
      if (declType(name, value) === "property") {
        value = dispatchProperty(name, value, el)
        // handles update observer
        const observerName = "&" + name
        if (decls[observerName]) {
          if (! el.batonCache) {
            el.batonCache = {}
          }
          if (name in el.batonCache) {
            const oldValue = el.batonCache[name]
            if (oldValue !== value) {
              callbacks.push([decls[observerName], el, name, value, oldValue, null])
            }
          }
          el.batonCache[name] = value
        }
        // Always store event handlers
        if (name[0] === 'o' && name[1] === 'n') {
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

  const dispatchProperty = (name, value, el) => {
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
    else if (name === 'children') {  // case: children special attribute
      const [newKeys, template] = value
      if (! el.batonCache) {
        el.batonCache = {}
      }
      if (el.batonCache.children) {
        const keyToEl = {}
        for (let c of el.childNodes) {
          if (c.dataset && c.dataset.batonKey) {
            keyToEl[c.dataset.batonKey] = c
          }
        }
        const oldKeys = el.batonCache.children
        for (let ev of diff(newKeys, oldKeys)) {
          switch (ev.type) {
            case 'insert': {
              const c = createElement(template, el)
              c.dataset.batonKey = ev.key
              const prev = ev.afterKey ? keyToEl[ev.afterKey] : null
              el.insertBefore(c, prev ? prev.nextSibling : el.childNodes[0])
              lifecycles.set(c, true)
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
      el.batonCache.children = newKeys
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
    const decls = show(state)
    dispatchElement(decls, baseEl)
    
    // There may be elements without declarations. We process them here.
    lifecycles.forEach((lifecycle, el) => {
      if (! lifecycle) {
        el.parentNode.removeChild(el)
      }
    })
    lifecycles.clear()
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

const createElement = (template, parent) => {
  if (template instanceof HTMLTemplateElement) {
    return template.content.firstElementChild.cloneNode(true)
  } else {
    return template.cloneNode(true)
  }
}