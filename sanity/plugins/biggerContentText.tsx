import React from 'react'
import {definePlugin} from 'sanity'

export const biggerContentTextPlugin = definePlugin(() => {
  return {
    name: 'bigger-content-text-plugin',
    studio: {
      components: {
  layout: function BiggerContentLayout(props: { renderDefault: (p: unknown) => React.ReactNode }) {
          return (
            <>
              {props.renderDefault(props)}
              <style>{`
                /* Increase Portable Text editor base size */
                [data-sanity-studio] [data-slate-editor] {
                  font-size: 1.05rem;
                  line-height: 1.65;
                  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif;
                }
                /* Heading scale */
                [data-sanity-studio] h1 { font-size: 2rem; line-height: 1.2; }
                [data-sanity-studio] h2 { font-size: 1.6rem; line-height: 1.25; }
                [data-sanity-studio] h3 { font-size: 1.35rem; line-height: 1.3; }
                [data-sanity-studio] h4 { font-size: 1.15rem; line-height: 1.35; }
                [data-sanity-studio] blockquote { font-size: 1.1rem; padding-left: .9rem; border-left: 4px solid var(--card-border-color, #ddd); }
                [data-sanity-studio] ul { padding-left: 1.4rem; }
                [data-sanity-studio] li { margin: .25rem 0; }
                [data-sanity-studio] strong { font-weight: 700; }
              `}</style>
            </>
          )
        }
      }
    }
  }
})

export default biggerContentTextPlugin
