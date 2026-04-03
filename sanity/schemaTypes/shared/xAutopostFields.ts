import { defineField } from 'sanity'

type HiddenResolverArgs = {
  document?: Record<string, unknown>
  parent?: unknown
  value?: unknown
}

type XAutopostFieldOptions = {
  hidden?: (args: HiddenResolverArgs) => boolean
  group?: string
}

function withSharedOptions<T extends Record<string, unknown>>(base: T, options: XAutopostFieldOptions): T & { group?: string } {
  return {
    ...base,
    ...(options.group ? { group: options.group } : {}),
  }
}

function hideIfNeeded(
  options: XAutopostFieldOptions,
  extra?: (args: HiddenResolverArgs) => boolean,
) {
  return (args: HiddenResolverArgs) => {
    const sharedHidden = options.hidden ? options.hidden(args) : false
    const extraHidden = extra ? extra(args) : false
    return sharedHidden || extraHidden
  }
}

export function createXAutopostFields(options: XAutopostFieldOptions = {}) {
  return [
    defineField(
      withSharedOptions(
        {
          name: 'autoPostToX',
          title: 'Auto-post to X',
          type: 'boolean',
          initialValue: true,
          description: 'Automatically create an X post the first time this item is published.',
          fieldset: 'socialMedia',
          hidden: hideIfNeeded(options),
        },
        options,
      ) as Parameters<typeof defineField>[0],
    ),
    defineField(
      withSharedOptions(
        {
          name: 'xPostCustomText',
          title: 'X Post Override',
          type: 'text',
          rows: 3,
          description: 'Optional custom X copy. Leave blank to auto-generate from the title and summary.',
          validation: (Rule: { max: (n: number) => unknown }) =>
            Rule.max(240),
          fieldset: 'socialMedia',
          hidden: hideIfNeeded(options),
        },
        options,
      ) as Parameters<typeof defineField>[0],
    ),
    defineField(
      withSharedOptions(
        {
          name: 'xPostStatus',
          title: 'X Post Status',
          type: 'string',
          readOnly: true,
          description: 'Managed automatically after publish.',
          fieldset: 'socialMedia',
          hidden: hideIfNeeded(options, ({ document }) => !document?.xPostStatus),
        },
        options,
      ) as Parameters<typeof defineField>[0],
    ),
    defineField(
      withSharedOptions(
        {
          name: 'xPostText',
          title: 'Posted X Copy',
          type: 'text',
          rows: 4,
          readOnly: true,
          description: 'The final text that was sent to X.',
          fieldset: 'socialMedia',
          hidden: hideIfNeeded(options, ({ document }) => !document?.xPostText),
        },
        options,
      ) as Parameters<typeof defineField>[0],
    ),
    defineField(
      withSharedOptions(
        {
          name: 'xPostUrl',
          title: 'Posted X URL',
          type: 'url',
          readOnly: true,
          description: 'Filled automatically after a successful post.',
          fieldset: 'socialMedia',
          hidden: hideIfNeeded(options, ({ document }) => !document?.xPostUrl),
        },
        options,
      ) as Parameters<typeof defineField>[0],
    ),
    defineField(
      withSharedOptions(
        {
          name: 'xPostedAt',
          title: 'X Posted At',
          type: 'datetime',
          readOnly: true,
          fieldset: 'socialMedia',
          hidden: hideIfNeeded(options, ({ document }) => !document?.xPostedAt),
        },
        options,
      ) as Parameters<typeof defineField>[0],
    ),
    defineField(
      withSharedOptions(
        {
          name: 'xPostError',
          title: 'X Post Error',
          type: 'text',
          rows: 3,
          readOnly: true,
          description: 'Most recent autopost error, if any.',
          fieldset: 'socialMedia',
          hidden: hideIfNeeded(options, ({ document }) => !document?.xPostError),
        },
        options,
      ) as Parameters<typeof defineField>[0],
    ),
  ]
}
