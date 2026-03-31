import {useState} from 'react'
import {Button, Card, Flex, Stack, Text, TextArea} from '@sanity/ui'
import {ObjectInputProps, set} from 'sanity'

type TableRowValue = {
  _type: 'dataTableRow'
  _key: string
  cells: string[]
}

type DataTableValue = {
  _type?: string
  caption?: string
  columns?: string[]
  rows?: TableRowValue[]
}

const stripOuterPipes = (line: string) => {
  let next = line.trim()
  if (next.startsWith('|')) next = next.slice(1)
  if (next.endsWith('|')) next = next.slice(0, -1)
  return next
}

const splitCsvLine = (line: string) => {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const next = line[index + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  cells.push(current.trim())
  return cells
}

const splitSpacedLine = (line: string) =>
  line
    .trim()
    .split(/\s{2,}/)
    .map((cell) => cell.trim())

const isMarkdownDividerRow = (cells: string[]) =>
  cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s+/g, '')))

const normalizeRows = (rows: string[][]) => {
  const columnCount = Math.max(...rows.map((row) => row.length))
  return rows.map((row) => Array.from({length: columnCount}, (_, index) => row[index] ?? ''))
}

const parseTableText = (input: string) => {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    throw new Error('Paste at least a header row and one data row.')
  }

  let parsedRows: string[][]

  if (lines.some((line) => line.includes('\t'))) {
    parsedRows = lines.map((line) => line.split('\t').map((cell) => cell.trim()))
  } else if (lines.every((line) => line.includes('|'))) {
    parsedRows = lines.map((line) =>
      stripOuterPipes(line)
        .split('|')
        .map((cell) => cell.trim()),
    )

    if (parsedRows[1] && isMarkdownDividerRow(parsedRows[1])) {
      parsedRows.splice(1, 1)
    }
  } else if (lines.every((line) => line.includes(','))) {
    parsedRows = lines.map(splitCsvLine)
  } else if (lines.every((line) => /\s{2,}/.test(line))) {
    parsedRows = lines.map(splitSpacedLine)
  } else {
    throw new Error('Use tab-separated, multi-space, comma-separated, or markdown table text.')
  }

  const normalizedRows = normalizeRows(parsedRows)
  const [columns, ...bodyRows] = normalizedRows

  if (columns.length < 2) {
    throw new Error('Tables need at least two columns.')
  }

  if (bodyRows.length === 0) {
    throw new Error('Paste at least one body row below the header.')
  }

  return {
    columns,
    rows: bodyRows.map((cells, index) => ({
      _type: 'dataTableRow' as const,
      _key: `row-${Date.now()}-${index}`,
      cells,
    })),
  }
}

const serializeTable = (value: DataTableValue | undefined) => {
  if (!value?.columns?.length) return ''

  const bodyRows = Array.isArray(value.rows) ? value.rows : []
  return [value.columns, ...bodyRows.map((row) => row.cells || [])]
    .map((row) => row.join('\t'))
    .join('\n')
}

export function DataTableInput(props: ObjectInputProps<DataTableValue>) {
  const [pastedText, setPastedText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleApply = () => {
    try {
      const {columns, rows} = parseTableText(pastedText)
      const nextValue: DataTableValue = {
        ...(props.value || {}),
        _type: props.schemaType.name,
        columns,
        rows,
      }

      props.onChange(set(nextValue))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse table text.')
    }
  }

  const handleLoadCurrent = () => {
    setPastedText(serializeTable(props.value))
    setError(null)
  }

  return (
    <Stack space={3}>
      <Card padding={3} radius={2} shadow={1} border>
        <Stack space={3}>
          <Text size={1}>
            Paste a table from Sheets, Excel, TSV, CSV, or a markdown table. The first row becomes the
            header.
          </Text>
          <TextArea
            rows={8}
            value={pastedText}
            onChange={(event) => {
              setPastedText(event.currentTarget.value)
              if (error) setError(null)
            }}
          />
          <Flex gap={2} wrap="wrap" align="center">
            <Button
              text="Apply pasted table"
              tone="primary"
              onClick={handleApply}
              disabled={!pastedText.trim()}
            />
            <Button text="Load current table" onClick={handleLoadCurrent} />
          </Flex>
          {error ? (
            <Text size={1} style={{whiteSpace: 'pre-wrap'}} className="text-red-400">
              {error}
            </Text>
          ) : null}
        </Stack>
      </Card>
      {props.renderDefault(props)}
    </Stack>
  )
}

export default DataTableInput
