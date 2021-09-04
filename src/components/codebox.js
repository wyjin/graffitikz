import { Component } from 'preact'
import classNames from 'classnames'

export class CodeBox extends Component {
    constructor(props) {
      super(props)
    }

    componentDidUpdate(prevProps) {
      if (!prevProps.show && this.props.show) {
        this.textareaElement.focus()
        this.textareaElement.select()
      }
    }

    handleOverlayPointerDown = evt => {
      if (evt.target !== evt.currentTarget) return

      let {onClose = () => {}} = this.props
      onClose(evt)
    }

    handleCopyClick = () => {
      copyText(this.props.code)
    }

    render() {
      let {show, code} = this.props

      return (
        <section
          id="modal-overlay"
          class={classNames({show})}
          onPointerDown={this.handleOverlayPointerDown}
        >
          <section class="modal-box code-box">
            <textarea readonly
              ref={el => (this.textareaElement = el)}
              value={code}
            />

            <ul class="buttons">
              <li>
                <button onClick={this.props.onClose}>Close</button>
              </li>
            </ul>
          </section>
        </section>
      )
    }
  }