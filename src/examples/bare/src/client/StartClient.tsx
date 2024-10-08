// @refresh skip
// @ts-ignore
import App from '#start/app'
import type { JSX } from 'solid-js'
import { ErrorBoundary } from '../examples/shared/ErrorBoundary'
import './mount'

function Dummy(props: { children: JSX.Element }) {
  return props.children
}

/**
 *
 * Read more: https://docs.solidjs.com/solid-start/reference/client/start-client
 */
export function StartClient() {
  return (
    <Dummy>
      <Dummy>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </Dummy>
    </Dummy>
  )
}
