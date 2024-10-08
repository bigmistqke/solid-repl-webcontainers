import { createSignal, Show } from 'solid-js'
import { Test } from './test'
export default function App() {
  const [count, setCount] = createSignal(0)
  return (
    <main>
      <Show when={false}>
        <Test />
      </Show>
      <h1>Hello world!</h1>
      <button class="increment" onClick={() => setCount(count() + 1)} type="button">
        Clicks: {count()}
      </button>
      <p>
        Visit{' '}
        <a href="https://start.solidjs.com" target="_blank">
          start.solidjs.com
        </a>{' '}
        to learn how to build SolidStart apps.
      </p>
    </main>
  )
}
