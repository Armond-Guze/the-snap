import {definePlugin} from 'sanity'

// Clean plugin: injects a single <style> tag to adjust editor typography
export const biggerContentTextPlugin = definePlugin(() => ({
  name: 'bigger-content-text-plugin',
  studio: {
    onStudioMount() {
      if (typeof document === 'undefined') return
      const id = 'bigger-content-text-styles'
      if (document.getElementById(id)) return
      const style = document.createElement('style')
      style.id = id
      style.innerHTML = `
        [data-sanity-studio] [data-slate-editor] { font-size:1.07rem; line-height:1.65; }
        [data-sanity-studio] h1 { font-size:2rem; line-height:1.2; }
        [data-sanity-studio] h2 { font-size:1.6rem; line-height:1.25; }
        [data-sanity-studio] h3 { font-size:1.35rem; line-height:1.3; }
        [data-sanity-studio] h4 { font-size:1.15rem; line-height:1.35; }
        [data-sanity-studio] blockquote { font-size:1.1rem; padding-left:.9rem; border-left:4px solid var(--card-border-color,#ddd); }
        [data-sanity-studio] ul { padding-left:1.4rem; }
        [data-sanity-studio] li { margin:.25rem 0; }
        [data-sanity-studio] strong { font-weight:700; }
      `
      document.head.appendChild(style)
    }
  }
}))

export default biggerContentTextPlugin
