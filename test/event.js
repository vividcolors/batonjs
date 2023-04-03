
import {typeOf, throttle, debounce} from '../src/baton.js'

const makeLogger = (box, prop) => {
  return (arg) => {
    box[prop].push(arg)
  }
}

const sleep = async (ms) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

const testDebounce = async (ctx) => {
  const box = {buf: []}
  const fn = debounce(makeLogger(box, "buf"), 300)
  fn("1")
  fn("2")
  fn("3")
  ctx.match("debounce1", () => box.buf.join(","), "")
  await sleep(500)
  ctx.match("debounce2", () => box.buf.join(","), "3")
  fn("4")
  fn("5")
  fn("6")
  fn("7")
  fn("8")
  fn("9")
  ctx.match("debounce3", () => box.buf.join(","), "3")
  await sleep(500)
  ctx.match("debounce4", () => box.buf.join(","), "3,9")
}

const testThrottle = async (ctx) => {
  const box = {buf: []}
  const fn = throttle(makeLogger(box, "buf"), 300)
  fn("1")
  fn("2")
  fn("3")
  ctx.match("throttle1", () => box.buf.join(","), "1")
  await sleep(300)
  ctx.match("throttle2", () => box.buf.join(","), "1,3")
  fn("4")
  fn("5")
  fn("6")
  fn("7")
  fn("8")
  ctx.match("throttle3", () => box.buf.join(","), "1,3")
  await sleep(300)
  fn("9")
  ctx.match("throttle4", () => box.buf.join(","), "1,3,8")
}

export const main = async (ctx) => {
  await testDebounce(ctx)
  await testThrottle(ctx)
}