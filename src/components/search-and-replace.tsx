import clsx from 'clsx'
import { createResource, createSignal, Index, Show } from 'solid-js'
// import { composeComment } from '../utils/compose-comment'
import { onToggle } from '../utils/on-toggle'
// import { spliceString } from '../utils/splice-string'
import { composeRegex } from '../utils/compose-regex'
import { CodiconButton } from './codicon/codicon-button'
// import { getHighlightElement } from './comment'
import { useSolidLab } from '../solidlab'
import solidlabStyles from '../solidlab.module.css'
import { every } from '../utils/conditionals'
import { escapeHtml } from '../utils/escape-html'
import { getMatchedRanges } from '../utils/get-matched-ranges'
import { getNameFromPath } from '../utils/get-name-from-path'
import { normalizePath } from '../utils/normalize-path'
import { Codicon } from './codicon/codicon'
import styles from './search-and-replace.module.css'

export interface RegexConfig {
  query: string
  isRegex: boolean
  isWholeWord: boolean
  isCaseSensitive: boolean
}
export interface UpdateAllConfig {
  search: RegexConfig
  replace: string
}
interface Match {
  path: string
  ranges: Array<{
    start: number
    end: number
    snippet: string
  }>
}

/**
 * SearchAndReplace component allows searching and replacing text within multiple files.
 */
export function SearchAndReplace() {
  const { search, setSearch, setSearchInput, webContainer } = useSolidLab()

  let replaceInput: HTMLInputElement
  let searchIcons: HTMLDivElement

  const regex = () => composeRegex(search.searchQuery, search)

  const [matches] = createResource(every(regex, webContainer), async ([regex, container]) => {
    const query = search.searchQuery
    if (!query) {
      return []
    }

    const result: Match[] = []
    const escapedQuery = composeRegex(escapeHtml(query), { isSingleMatch: true })
    const escapedRegex = escapedQuery

    const iterate = async (path: string) => {
      if (path === './node_modules') {
        return
      }
      const dirContents = await container.fs.readdir(path, { withFileTypes: true })

      await Promise.all(
        dirContents.map(async content => {
          const contentPath = `${path}/${content.name}`

          if (contentPath.endsWith('package-lock.json')) {
            return
          }

          if (content.isDirectory()) {
            await iterate(contentPath)
          } else {
            const source = await container.fs.readFile(contentPath, 'utf-8')

            const ranges = getMatchedRanges(source, regex).map(range => {
              const slice = source.slice(Math.max(0, range.start - 10), source.length)
              const snippet = escapeHtml(slice).replace(
                escapedRegex,
                `<em>${source.slice(range.start, range.end)}</em>`,
              )
              return {
                ...range,
                snippet,
              }
            })

            if (ranges.length > 0) {
              result.push({
                ranges,
                path: normalizePath(contentPath),
              })
            }
          }
        }),
      )
    }

    await iterate('.')

    return result
  })

  return (
    <>
      <div class={clsx(solidlabStyles.explorerBar, solidlabStyles.bar)}>
        <CodiconButton kind="new-file" />
        <CodiconButton kind="new-folder" />
      </div>
      <div class={styles.searchAndReplace}>
        <div class={styles.inputContainer}>
          <input
            id="search-input"
            aria-label="Find Input"
            title="Find Input"
            placeholder="Find"
            autocomplete="off"
            ref={setSearchInput}
            value={search.searchQuery}
            onInput={e => setSearch('searchQuery', e.currentTarget.value)}
          />
          <div ref={searchIcons!} class={styles.inputIcons}>
            <CodiconButton
              aria-label="Match Case"
              title="Match Case"
              kind="case-sensitive"
              class={search.isCaseSensitive ? styles.active : undefined}
              onClick={() => setSearch('isCaseSensitive', boolean => !boolean)}
            />
            <CodiconButton
              aria-label="Match Whole Word"
              title="Match Whole Word"
              kind="whole-word"
              class={search.isWholeWord ? styles.active : undefined}
              onClick={() => setSearch('isWholeWord', boolean => !boolean)}
            />
            <CodiconButton
              aria-label="Use Regular Expression"
              title="Use Regular Expression"
              class={search.isRegex ? styles.active : undefined}
              kind="regex"
              onClick={() => setSearch('isRegex', boolean => !boolean)}
            />
          </div>
        </div>
        <div class={styles.inputContainer}>
          <input
            ref={replaceInput!}
            aria-label="Replace Input"
            placeholder="Replace"
            onInput={e => setSearch('replaceQuery', e.currentTarget.value)}
          />
          <div class={styles.inputIcons} data-break-350-show>
            <CodiconButton aria-label="Replace Next Occurences" kind="replace" />
            <CodiconButton aria-label="Replace All Occurences" kind="replace-all" />
          </div>
        </div>
      </div>
      <div class={styles.searchResultsContainer}>
        <div class={styles.searchResults}>
          <Index each={matches()}>
            {(match, index) => (
              <SearchResult {...match()} isLast={matches()!.length - 1 === index} />
            )}
          </Index>
        </div>
      </div>
    </>
  )
}

function SearchResult(props: Match & { isLast: boolean }) {
  const { setActiveTab } = useSolidLab()

  const [open, setOpen] = createSignal(true)

  return (
    <>
      <button class={styles.file} onClick={onToggle(setOpen)}>
        <Codicon class={styles.fileIcon} kind={open() ? 'chevron-down' : 'chevron-right'} />
        <span class={styles.fileName}>{getNameFromPath(props.path)}</span>
      </button>
      <Show when={open()}>
        <Index each={props.ranges}>
          {value => (
            <button class={styles.searchResult} onClick={() => setActiveTab(props.path)}>
              <span innerHTML={value().snippet} />
            </button>
          )}
        </Index>
      </Show>
      <Show when={!props.isLast}>
        <div class={clsx(styles.separator, open() && styles.open)} />
      </Show>
    </>
  )
}
