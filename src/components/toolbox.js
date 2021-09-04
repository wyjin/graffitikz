import { Component } from 'preact'
import classNames from 'classnames'


export const Separator = () => <li class="separator"></li>

export class Button extends Component {
    handleClick = evt => {
        evt.preventDefault()

        let {onClick = () => {}} = this.props
        onClick(evt)
    }

    render() {
        let {checked, disabled, icon, name} = this.props

        return <li
            class={classNames('button', this.props.class, {checked, disabled})}
            title={name}
            id={this.props.id}
        >
            <a href="#" onClick={this.handleClick}>
                <img
                    style={{backgroundImage: `url('${icon}')`}}
                    src="./assets/blank.svg"
                    alt={name}
                />
            </a>
        </li>
    }
}

export class ToolBox extends Component {
    render() {
        return <section class={classNames('toolbox', this.props.class)} id={this.props.id}>
            <ul>{this.props.children}</ul>
        </section>
    }
}
