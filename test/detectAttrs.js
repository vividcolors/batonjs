import {detectAttrs} from '../src/baton.js'

const test1 = (ctx) => {
  ctx.match("1", () => detectAttrs((state) => ({a:state.a, b:state["b"], c:state['c']})), {a:true, b:true, c:true})
  ctx.match("2", () => detectAttrs(state => ({a:state.a, b:state["b"], c:state['c']})), {a:true, b:true, c:true})
  ctx.match("3", () => detectAttrs(function(state) {return {a:state.abc, b:state["hyphened-name"]}}), {abc:true, "hyphened-name":true})
  ctx.match("4", () => detectAttrs(state => {
    // line comment
    const b = state.a + 1
    /* multi-line
     * comment
     */
    return {abc: b, "b": state.foo}
  }), {a:true, foo:true})
  ctx.match("5", () => detectAttrs(function (state) {
    return {
      abc: state /* comment */ . foo, 
      def: state // comment
        . bar, 
      ghi: state . /* comment */ baz, 
      jkl: state . // comment
        qux
    }
  }), {foo:true, bar:true, baz:true, qux:true})
}

export const main = async (ctx) => {
  test1(ctx)
}
