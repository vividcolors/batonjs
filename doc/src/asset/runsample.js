
const result = document.getElementById('result')
const selector = document.getElementById('selector')
const src = document.getElementById('src')
selector.addEventListener('change', (ev) => {
  const url = new URL(window.location)
  url.searchParams.set('no', ev.target.value)
  history.pushState(ev.target.value, '', url)
  load(ev.target.value)
})
const adjust = () => {
  const grid = document.getElementById('the-grid')
  const dh = document.getElementById('footer').getBoundingClientRect().bottom + (window.pageYOffset || document.documentElement.scrollTop)
  const gr = grid.getBoundingClientRect()
  const wh = window.innerHeight
  const gh = gr.height
  const rh = dh - gr.height
  const h = wh - rh
  grid.style.setProperty('--height', h + "px")
  result.removeAttribute("width")
  result.removeAttribute("height")

  const url = new URL(window.location)
  let no = url.searchParams.get('no')
  if (! no) no = "1"
  selector.querySelector("[value='" + no + "']").selected = true
  load(no)
}
const load = (no) => {
  const url = `../samples/sample${no}.html`
  result.src = url
  fetch(url)
  .then(res => res.text())
  .then(txt => {
    src.textContent = txt
    if (window.Prism) {
      window.Prism.highlightAll()
    }
  })
}
adjust()