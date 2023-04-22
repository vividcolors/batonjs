import {diff} from '../src/baton.js'

const test1 = (ctx) => {
  const oldKeys = ["a", "b", "c", "d"]
  ctx.match("remove first", () => diff(["b", "c", "d"], oldKeys), [{type:"remove", key:"a"}])
  ctx.match("remove middle", () => diff(["a", "c", "d"], oldKeys), [{type:"remove", key:"b"}])
  ctx.match("remove last", () => diff(["a", "b", "c"], oldKeys), [{type:"remove", key:"d"}])
  ctx.match("insert first", () => diff(["e", "a", "b", "c", "d"], oldKeys), [{type:"insert", key:"e", afterKey:null, index:0}])
  ctx.match("insert middle", () => diff(["a", "b", "c", "e", "d"], oldKeys), [{type:"insert", key:"e", afterKey:"c", index:3}])
  ctx.match("insert last", () => diff(["a", "b", "c", "d", "e"], oldKeys), [{type:"insert", key:"e", afterKey:"d", index:4}])
  ctx.match("move down first to middle", () => diff(["b", "c", "a", "d"], oldKeys), [{type:"move", key:"a", afterKey:"c"}])
  ctx.match('move down first to last', () => diff(["b", "c", "d", "a"], oldKeys), [{type:"move", key:"a", afterKey:"d"}])
  ctx.match('move down middle to middle', () => diff(["a", "c", "b", "d"], oldKeys), [{type:"move", key:"b", afterKey:"c"}])
  ctx.match('move down middle to last', () => diff(["a", "c", "d", "b"], oldKeys), [{type:"move", key:"b", afterKey:"d"}])
  ctx.match('move up middle to first', () => diff(["c", "a", "b", "d"], oldKeys), [{type:"move", key:"c", afterKey:null}])
  ctx.match('move up middle to middle', () => diff(["a", "c", "b", "d"], oldKeys), [{type:"move", key:"b", afterKey:"c"}])  // or [{type:"move", key:"c", afterKey:"a"}]
  ctx.match('move up last to first', () => diff(["d", "a", "b", "c"], oldKeys), [{type:"move", key:"d", afterKey:null}])
  ctx.match('move up last to middle', () => diff(["a", "d", "b", "c"], oldKeys), [{type:"move", key:"d", afterKey:"a"}])
}

const update = (evs, oldKeys) => {
  const keys = [...oldKeys]
  for (let ev of evs) {
    switch (ev.type) {
      case 'insert': {
        const i = ev.afterKey ? (keys.indexOf(ev.afterKey) + 1) : 0
        keys.splice(i, 0, ev.key)
        break
      }
      case 'remove': {
        const i = keys.indexOf(ev.key)
        keys.splice(i, 1)
        break
      }
      case 'move': {
        const i = keys.indexOf(ev.key)
        keys.splice(i, 1)
        const j = ev.afterKey ? (keys.indexOf(ev.afterKey) + 1) : 0
        keys.splice(j, 0, ev.key)
      }
    }
  }
  return keys
}

const test2 = (ctx) => {
  const oldKeys = ["a", "b", "c", "d"]
  {
    const keys = ["d", "c"]
    ctx.match("2-1", () => update(diff(keys, oldKeys), oldKeys), keys)
  }
  {
    const keys = ["e", "a", "f"]
    ctx.match("2-2", () => update(diff(keys, oldKeys), oldKeys), keys)
  }
  {
    const keys = ["a", "d", "c", "b"]
    ctx.match("2-3", () => update(diff(keys, oldKeys), oldKeys), keys)
  }
  {
    const keys = ["b", "d", "a", "c"]
    ctx.match("2-4", () => update(diff(keys, oldKeys), oldKeys), keys)
  }
}

export const main = async (ctx) => {
  test1(ctx)
  test2(ctx)
}