
import {typeOf, insert, remove, update} from '../src/baton.js'

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

const match0 = (name, lhs, rhs) => {
  if (lhs !== rhs) console.log(`test failed: ${name}; ${lhs} !== ${rhs}`)
  else console.log('.')
}

const match = (name, lhs, rhs) => {
  if (! isEqual(lhs, rhs)) console.log(`test failed: ${name}; ${lhs} !== ${rhs}`)
  else console.log('.')
}

const matchError = (name, fn) => {
  try {
    fn()
    console.log(`test failed: ${name}`)
  } catch (x) {
    console.log('.')
  }
}

match0("a1", typeOf(null), "null")
match0("a2", typeOf({}), "object")
match0("a3", typeOf({a:1}), "object")
match0("a4", typeOf([]), "array")
match0("a5", typeOf([1]), "array")
match0("a6", typeOf(0), "number")
match0("a7", typeOf(""), "string")
match0("a8", typeOf(false), "boolean")

match("b1", insert(0, "a", [0, 1, 2]), ["a", 0, 1, 2])
match("b2", insert(1, "a", [0, 1, 2]), [0, "a", 1, 2])
match("b3", insert(2, "a", [0, 1, 2]), [0, 1, "a", 2])
match("b4", insert(3, "a", [0, 1, 2]), [0, 1, 2, "a"])
matchError("b5", () => {insert(-1, "a", [0, 1, 2])})
matchError("b6", () => {insert(4, "a", [0, 1, 2])})
match("b7", insert("a", "a", {"x": 1}), {"x": 1, "a": "a"})
matchError("b8", () => {insert("a", "a", {"a": 1})})

match("c1", remove(0, [0, 1, 2]), [1, 2])
match("c2", remove(1, [0, 1, 2]), [0, 2])
match("c3", remove(2, [0, 1, 2]), [0, 1])
matchError("c4", () => {remove(-1, [0, 1, 2])})
matchError("c5", () => {remove(3, [0, 1, 2])})
match("c6", remove("a", {"x": 1, "a": 2}), {"x": 1})
match("c7", remove("a", {"a": 1}), {})
matchError("c8", () => {remove("a", {"x": 1})})

match("d1", update([0, 1, 2]), [0, 1, 2])
match("d2", update(0, "a", [0, 1, 2]), ["a", 1, 2])
match("d3", update(1, "a", [0, 1, 2]), [0, "a", 2])
match("d4", update(2, "a", [0, 1, 2]), [0, 1, "a"])
match("d5", update(0, "a", 2, "b", [0, 1, 2]), ["a", 1, "b"])
matchError("d6", () => {update(-1, "a", [0, 1, 2])})
matchError("d7", () => {update(0, "a", 3, "b", [0, 1, 2])})
match("d8", update({"a": 1, "b": 2}), {"a": 1, "b": 2})
match("d9", update("a", "a", {"a": 1, "b": 2}), {"a": "a", "b": 2})
match("d10", update("a", "a", "b", "b", {"a": 1, "b": 2}), {"a": "a", "b": "b"})
matchError("d11", () => {update("x", 1, {"a": 1, "b": 2})})
matchError("d12", () => {update("a", "a", "x", 1, {"a": 1, "b": 2})})