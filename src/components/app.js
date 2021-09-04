import { Component } from 'preact'
import classNames from 'classnames'
import { ToolBox, Button, Separator } from './toolbox'
import { CodeBox } from './codebox'
import { Canvas } from './canvas'
import copyToClipboard from 'copy-text-to-clipboard'

export class App extends Component {
    constructor() {
        super()

        this.state = {
            tool: 'pan',
            showCode: false,
            stateHash: window.location.hash,
            showInfo: false,
        }
        this.prevTool = null
        this.canvas = null
    }

    componentDidMount() {
        window.onbeforeunload = () => {
            return "You are leaving this page. All unsaved work will be lost."
        }
        this.undo = this.canvas.undo
        this.redo = this.canvas.redo
        document.addEventListener('keydown', evt => {
            if (evt.key === ' ' && this.prevTool == null && this.canvas && !this.canvas.cannotUseToolSwitchShortcuts()) {
                this.prevTool = this.state.tool
                this.canvas.togglePropsBar(false)
                this.setState({tool: 'pan'})
            }
            else if (evt.metaKey || evt.ctrlKey) {
                switch (evt.key) {
                    case 'y': case 'Y':
                        evt.preventDefault();
                        evt.stopPropagation();
                        this.redo()
                        break;
                    case 'z': case 'Z':
                        if (evt.shiftKey) {
                            evt.preventDefault();
                            evt.stopPropagation();
                            this.redo()
                        } else {
                            evt.preventDefault();
                            evt.stopPropagation();
                            this.undo()
                        }
                        break;
                    case 's': case 'S':
                        evt.preventDefault();
                        evt.stopPropagation();
                        this.copyPermalink()
                }
            }
        })
        document.addEventListener('keyup', evt => {
            if (evt.key === ' ' && this.prevTool) {
                this.setState({tool: this.prevTool}, ()=>{
                    if (['line', 'roundShape', 'polygon', 'curve', 'text'].includes(this.prevTool) || (this.prevTool==='select' && this.canvas.getSelectedShape() != '')) {
                        this.canvas.togglePropsBar(true)
                    }
                    this.prevTool = null
                })
            }
        })
    }

    openCodeBox = () => {
        this.setState({showCode: true})
    }

    closeCodeBox = () => {
        this.setState({showCode: false})
    }

    handleToolClick = tool => {
        if (this.toolClickHandlersCache == null) this.toolClickHandlersCache = {}

        if (this.toolClickHandlersCache[tool] == null) {
          this.toolClickHandlersCache[tool] = _evt => {
            this.setState({tool})
            if (this.canvas){
                if (['line', 'roundShape', 'polygon', 'curve', 'text'].includes(tool)) {
                    this.canvas.togglePropsBar(true)
                } else {
                    this.canvas.togglePropsBar(false)
                }
                this.canvas.afterDrawUpdate()
            }
          }
        }


        return this.toolClickHandlersCache[tool]
    }
    toggleInfo = ()=> {
        this.setState({
            showInfo: !this.state.showInfo
        })
    }

    openGithubLink = () => {
        window.open("https://github.com/wyjin", "_blank")
    }

    openManualLink = () => {
        window.open("https://github.com/wyjin", "_blank")
    }

    generateCode = () => {
        let code = '%\\usepackage{tikz}\n\\begin{tikzpicture}[x=0.4pt, y=0.4pt]\n'
        if (this.canvas)
            code += this.canvas.generateCode()
        code += '\\end{tikzpicture}\n'

        return code
    }

    copyPermalink = () => {
        if (!this.canvas)
            return
        const baseUrl = window.location.origin + window.location.pathname
        const permalink = this.canvas.genPermalink()
        copyToClipboard(baseUrl+ '#'+ permalink)
        alert('Permalink copied to clipboard.')
    }

    render() {
        return (
            <>
            <Canvas ref={el => {this.canvas = el}} cellSize="20" stateHash={this.state.stateHash} tool={this.state.tool} />
            <ToolBox class={classNames('fixed-toolbox')}>
                <Button
                    checked={this.state.tool === 'pan'}
                    icon="./assets/pan.svg"
                    name="Pan (Hold <SPACE>)"
                    onClick={this.handleToolClick('pan')}
                />
                <Button
                    checked={this.state.tool === 'select'}
                    icon="./assets/sel.svg"
                    name="Select"
                    onClick={this.handleToolClick('select')}
                />
                <Separator />
                <Button
                    checked={this.state.tool === 'line'}
                    icon='./assets/e.svg'
                    name='Line'
                    onClick={this.handleToolClick('line')}
                />
                <Button
                    checked={this.state.tool === 'roundShape'}
                    icon="./assets/circle.svg"
                    name="Round Shape"
                    onClick={this.handleToolClick('roundShape')}
                />
                <Button
                    checked={this.state.tool === 'polygon'}
                    icon="./assets/polygon.svg"
                    name="Polygon"
                    onClick={this.handleToolClick('polygon')}
                />
                <Button
                    checked={this.state.tool === 'curve'}
                    icon="./assets/curve2.svg"
                    name="Cubic Bezier Curve"
                    onClick={this.handleToolClick('curve')}
                />
                <Button
                    checked={this.state.tool === 'text'}
                    icon="./assets/text.svg"
                    name="Text"
                    onClick={this.handleToolClick('text')}
                />
                <Separator />
                <Button
                    icon="./assets/undo.svg"
                    name="Undo (Ctrl-Z / Cmd-Z)"
                    onClick={this.undo}
                />
                <Button
                    icon="./assets/redo.svg"
                    name="Redo (Ctrl-Y / Cmd-Y / Cmd-Shift-Z)"
                    onClick={this.redo}
                />
                <Separator/>
                <Button
                    checked={this.state.showCode}
                    icon="./assets/code.svg"
                    name="TikZ Code Box"
                    onClick={this.openCodeBox}
                />
                <Button
                    icon="./assets/save.svg"
                    name="Save Permalink (Ctrl-S / Cmd-S)"
                    onClick={this.copyPermalink}
                />

            </ToolBox>

            <ToolBox class={classNames('floating-toolbox', 'right')}>

                <Button class="float-button"
                    id="info"
                    icon="./assets/info.svg"
                    name="Show Info"
                    onClick={this.toggleInfo}
                />
                {this.state.showInfo &&
                <>
                    <Button class="float-button"
                        icon="./assets/help.svg"
                        name="Help"
                        onClick={this.openManualLink}
                    />

                    <Button class="float-button"
                        icon="./assets/github.svg"
                        name="Github"
                        onClick={this.openGithubLink}
                    />
                </>
                }
            </ToolBox>

            <CodeBox code={this.generateCode()} show={this.state.showCode} onClose={this.closeCodeBox}/>
            </>
        )
    }
}