
import {typeOf, insert, remove, update} from '../src/baton.js'

export const main = async (ctx) => {
  ctx.match("a1", () => typeOf(null), "null")
  ctx.match("a2", () => typeOf({}), "object")
  ctx.match("a3", () => typeOf({a:1}), "object")
  ctx.match("a4", () => typeOf([]), "array")
  ctx.match("a5", () => typeOf([1]), "array")
  ctx.match("a6", () => typeOf(0), "number")
  ctx.match("a7", () => typeOf(""), "string")
  ctx.match("a8", () => typeOf(false), "boolean")
  
  ctx.match("b1", () => insert(0, "a", [0, 1, 2]), ["a", 0, 1, 2])
  ctx.match("b2", () => insert(1, "a", [0, 1, 2]), [0, "a", 1, 2])
  ctx.match("b3", () => insert(2, "a", [0, 1, 2]), [0, 1, "a", 2])
  ctx.match("b4", () => insert(3, "a", [0, 1, 2]), [0, 1, 2, "a"])
  ctx.matchError("b5", () => {insert(-1, "a", [0, 1, 2])})
  ctx.matchError("b6", () => {insert(4, "a", [0, 1, 2])})
  ctx.match("b7", () => insert("a", "a", {"x": 1}), {"x": 1, "a": "a"})
  ctx.matchError("b8", () => {insert("a", "a", {"a": 1})})
  
  ctx.match("c1", () => remove(0, [0, 1, 2]), [1, 2])
  ctx.match("c2", () => remove(1, [0, 1, 2]), [0, 2])
  ctx.match("c3", () => remove(2, [0, 1, 2]), [0, 1])
  ctx.matchError("c4", () => {remove(-1, [0, 1, 2])})
  ctx.matchError("c5", () => {remove(3, [0, 1, 2])})
  ctx.match("c6", () => remove("a", {"x": 1, "a": 2}), {"x": 1})
  ctx.match("c7", () => remove("a", {"a": 1}), {})
  ctx.matchError("c8", () => {remove("a", {"x": 1})})
  
  ctx.match("d1", () => update([0, 1, 2]), [0, 1, 2])
  ctx.match("d2", () => update(0, "a", [0, 1, 2]), ["a", 1, 2])
  ctx.match("d3", () => update(1, "a", [0, 1, 2]), [0, "a", 2])
  ctx.match("d4", () => update(2, "a", [0, 1, 2]), [0, 1, "a"])
  ctx.match("d5", () => update(0, "a", 2, "b", [0, 1, 2]), ["a", 1, "b"])
  ctx.matchError("d6", () => {update(-1, "a", [0, 1, 2])})
  ctx.matchError("d7", () => {update(0, "a", 3, "b", [0, 1, 2])})
  ctx.match("d8", () => update({"a": 1, "b": 2}), {"a": 1, "b": 2})
  ctx.match("d9", () => update("a", "a", {"a": 1, "b": 2}), {"a": "a", "b": 2})
  ctx.match("d10", () => update("a", "a", "b", "b", {"a": 1, "b": 2}), {"a": "a", "b": "b"})
  ctx.matchError("d11", () => {update("x", 1, {"a": 1, "b": 2})})
  ctx.matchError("d12", () => {update("a", "a", "x", 1, {"a": 1, "b": 2})})
}
