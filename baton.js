



export const baton = (state, show, baseEl) => {
    const ehcache = new WeakMap()  // event handler cache; el -> {[event-type]:handler}
    const tasks = []  // update tasks for elements; {el, props}[]
    const posttasks = []  // posttask[]; posttask: () => void
    if (! baseEl) {
      baseEl = document.documentElement
    }

    const withState = (updater) => {
      const state0 = updater(state)
      if (state0 && state0 !== state) {
        state = state0
        const decls = show(state)
        const props = {}
        tasks.push({el:baseEl, props})
        select(decls, baseEl, props)
        update()
        postfix()
      }
    }
  
    const select = (decls, el, props) => {
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
            select(subDecls, subEls[i], subProps)
          }
        }
      }
    }
    const update = () => {
      while (tasks.length) {
        const {el, props} = tasks.shift()
        for (let name in props) {
          const value = props[name]
          if (name[0] == 'o' && name[1] == 'n') {  // event handler
            const eventType = name.slice(2)
            let ehs = null
            if (ehcache.has(el)) {
              ehs = ehcache.get(el)
            } else {
              ehs = {}
              ehcache.set(el, ehs)
            }
            if (ehs[eventType]) {
              if (ehs[eventType] === value) {
                // unchanged
              } else {
                // handler changed
                el.removeEventListener(eventType, ehs[eventType])
                el.addEventListener(eventType, value)
                ehs[eventType] = value
              }
            } else {
              // new handler
              el.addEventListener(eventType, value)
              ehs[eventType] = value
            }
          }
          else if (name[0] == '@') {
            const dataName = name.slice(1)
            if (! el.batonVirtual) {
              el.batonVirtual = {}
            }
            if (el.batonVirtual.hasOwnProperty(dataName)) {
              const oldValue = el.batonVirtual[dataName]
              if (value !== oldValue) {
                posttasks.push(() => {
                  const ehs = ehcache.get(el)
                  if (ehs && ehs[dataName]) {
                    ehs[dataName](el, dataName, value, oldValue)
                  }
                })
              }
            }
            el.batonVirtual[dataName] = value
          }
          else if (name == "classList") {
            for (let c in value) {
              if (value[c]) {
                el.classList.add(c)
              } else {
                el.classList.remove(c)
              }
            }
          }
          else if (value !== null && typeof value == "object") {
            for (let x in value) {
              el[name][x] = value[x]
            }
          }
          else {
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
  
    const decls = show(state)
    const props = {}
    tasks.push({el:baseEl, props})
    select(decls, baseEl, props)
    update()
    postfix()

    return withState
  } 