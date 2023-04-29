
import {typeOf} from '../src/baton.js'

const moduleNames = ["data.js", "event.js", "diff.js", "detectAttrs.js"]

const isEqual = (a, b) => {
  const ta = typeOf(a)
  const tb = typeOf(b)
  if (ta !== tb) return false
  switch (ta) {
    case 'array': {
      if (a.length !== b.length) return false
      for (let i = 0; i < a.length; i++) {
        if (! isEqual(a[i], b[i])) return false
      }
      return true
    }
    case 'object': {
      if (Object.keys(a).length !== Object.keys(b).length) return false
      for (let p in a) {
        if (! b.hasOwnProperty(p) || ! isEqual(a[p], b[p])) return false
      }
      return true
    }
    default: 
      return (a === b)
  }
}

const makeContext = () => {
  let totalCount = 0
  let failures = []
  return [
    {
      match: (name, lhsFun, rhs) => {
        totalCount++
        const lhs = lhsFun()
        if (! isEqual(lhs, rhs)) failures.push(`test failed: ${name}; ${JSON.stringify(lhs)} != ${JSON.stringify(rhs)}`)
      }, 
      matchError: (name, lhsFun) => {
        totalCount++
        try {
          lhsFun()
          failures.push(`test failed: ${name}`)
        } catch (x) {
          // do nothing
        }
      }
    }, 
    () => ({totalCount, failures})
  ]
}

const echo = (str) => {
  console.log(str)
}

const run1 = async (moduleName) => {
  const [ctx, getResult] = makeContext()
  const module = await import("./" + moduleName)
  echo(`${moduleName} START`)
  await module.main(ctx)
  const {totalCount, failures} = getResult()
  for (let f of failures) {
    echo('- ' + f)
  }
  echo(`${moduleName} END; total:${totalCount}, failures:${failures.length}`)
}

for (let moduleName of moduleNames) {
  await run1(moduleName)
}