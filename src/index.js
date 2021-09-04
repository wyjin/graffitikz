import { render } from 'preact'
import { App } from './components/app';
import './style'

if (typeof window !== "undefined"){
  render(<App />, document.body)
}
