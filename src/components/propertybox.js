import { Component } from 'preact'
import classNames from 'classnames'
import { RgbaColorPicker } from 'react-colorful'
import { Button, Separator } from './toolbox'

export default class PropertyBox extends Component {

    shouldComponentUpdate(nextProps) {
        return (
            nextProps.tool != this.props.tool ||
            nextProps.id != this.props.id ||
            nextProps.snapping != this.props.snapping
        )
    }
    componentDidUpdate(prevProps) {
        if (prevProps.snapping != this.props.snapping) {
            this.setState({snapping: this.props.snapping})
        }
    }

    onInputNumberKeyDown = evt => {
        if (['Delete', 'Backspace', ' '].includes(evt.key)) {
            evt.stopPropagation()
        } else if (['Enter'].includes(evt.key)) {
            evt.target.blur()
        } else if (![37, 39].includes(evt.keyCode) && !/^[\d\.]$/.test(evt.key)){
            evt.preventDefault()
        }
    }

    onInputTextKeyDown = evt => {
        if (['Delete', 'Backspace', ' '].includes(evt.key)) {
            evt.stopPropagation()
        } else if (['Enter'].includes(evt.key)) {
            evt.target.blur()
        } else if (![37, 39].includes(evt.keyCode) && !/^[ -~]$/.test(evt.key)){
            evt.preventDefault()
        }
    }

    updateStrokeColor = (color) => {
        if (this.props.id !== '') {
            this.props.updateState(this.props.id, {strokeColor: color})
        }
    }

    updateFillColor = (color) => {
        if (this.props.id !== '') {
            this.props.updateState(this.props.id, {fillColor: color})
        }
    }

    updateText = (evt) => {
        document.getElementById('dummy').style.display = 'none'
        if (this.props.id !== '') {
            this.props.updateState(this.props.id, {text: evt.target.value})
        }
    }

    updateCornerRadius = (evt) => {
        document.getElementById('dummy').style.display = 'none'
        if (this.props.id !== '') {
            this.props.updateState(this.props.id, {cornerRadius: evt.target.value})
        }
    }

    updateStrokeWidth = (evt) => {
        document.getElementById('dummy').style.display = 'none'
        if (this.props.id !== '') {
            this.props.updateState(this.props.id, {strokeWidth: evt.target.value})
        }
    }

    focus = (evt) => {
        document.getElementById('dummy').style.display = 'block'
        evt.target.focus()
    }


    render() {
        const enableArrow = ['line', 'curve'].includes(this.props.tool) || (this.props.tool === 'select' && (this.props.id.includes('line') || (this.props.id.includes('curve') && this.props.params.closed === false)))
        const enableFill = ['roundShape', 'polygon', 'curve'].includes(this.props.tool) || (this.props.tool === 'select' && (this.props.id.includes('circle') || this.props.id.includes('polygon') || this.props.id.includes('curve')))
        const enableCorner = [ 'polygon'].includes(this.props.tool) || (this.props.tool === 'select' &&  this.props.id.includes('polygon'))
        const enableDelete = this.props.tool === 'select'
        const textEdit = this.props.tool === 'select' && this.props.id.includes('text')
        const text = ['text'].includes(this.props.tool) || textEdit

        return (
            <>
            <div id="dummy"/>
            <section id="properties" class={classNames({show: this.props.show})}>
                <ul>
                    {enableDelete &&
                        <>
                        <Button
                            checked={this.props.snapping}
                            icon="./assets/magnet.svg"
                            name="Toggle Snapping"
                            onClick={this.props.toggleSnapping}
                        />
                        <Separator />
                        </>
                    }

                {!text&&
                    <select key={this.props.id+'-line-style'} id="stroke-style" onChange={this.props.onStrokeStyleChange} value={this.props.params.strokeStyle}>
                        <option value='solid'>Solid</option>
                        <option value='dashed'>Dashed</option>
                    </select>
                }
                {enableArrow &&
                    <select key={this.props.id+'-arrow'} id="arrow" onChange={this.props.onArrowChange} value={this.props.params.arrow}>
                        <option value=''>No Arrow</option>
                        <option value='->'>Arrow</option>
                        <option value='<->'>Double-headed</option>
                    </select>
                }
                {!text &&
                    <>
                    <Separator />
                    <label for="line-width">Line Width: </label>
                    <input key={this.props.id+'-line-width'} ref={el=>this.lineWidthInput=el} type="number" id="line-width" onChange={this.props.onWeightChange} value={this.props.params.strokeWidth} min="0.5" max="15" step="0.5" onKeyDown={this.onInputNumberKeyDown} onBlur={this.updateStrokeWidth} onClick={this.focus} />
                    </>
                }
                {enableCorner &&
                    <>
                    <label for="corner-size">Corner Radius: </label>
                    <input key={this.props.id+'-corner-size'} ref={el=>this.cornerSizeInput=el} type="number" id="corner-size" onChange={this.props.onCornerRadiusChange} value={this.props.params.cornerRadius} min="0" max="100" step="5" onKeyDown={this.onInputNumberKeyDown} onBlur={this.updateCornerRadius} onClick={this.focus} />
                    </>
                }
                {!text &&
                    <>
                    <Separator />
                    <label for="stroke-color-picker">Stroke: </label>
                    </>
                }
                {textEdit &&
                    <>
                    <label for="text-node-content-edit">Text: </label>
                    <input key={this.props.id+'-text'} type="text" id="text-content" onChange={this.props.onTextChange} value={this.props.params.text} onKeyDown={this.onInputTextKeyDown} onChange={this.props.onTextChange} onBlur={this.updateText} onClick={this.focus} />
                    </>
                }
                {text &&
                    <label for="stroke-color-picker">Text Color: </label>
                }

                <ColorPickerToggler key={this.props.id+'-stroke-color'} id="stroke-color-picker" color={this.props.params.strokeColor} onChange={this.props.onStrokeColorChange} update={this.updateStrokeColor} />

                {enableFill &&
                    <>
                    <label for="fill-color-picker">Fill: </label>
                    <ColorPickerToggler key={this.props.id+'-fill-color'} id="fill-color-picker" color={this.props.params.fillColor} onChange={this.props.onFillColorChange} update={this.updateFillColor} />
                    </>
                }
                {enableDelete &&
                    <>
                    <Separator />
                    <Button class="remove" icon="./assets/trashcan.svg" name="Delete Node" onClick={this.props.onDelete}/>
                    </>
                }
                </ul>
            </section>
            </>
        )
    }
}


class ColorPickerToggler extends Component {
    constructor(props) {
        super(props)
        this.state = {
            isOpen: false,
            color:this.props.color,
        }
        this.picker = null
    }

    componentDidMount() {
        document.addEventListener('pointerdown', evt=>this.handlePointerDown(evt))
        document.addEventListener('touchstart', evt=>this.handlePointerDown(evt))
    }

    handlePointerDown(evt) {
        if (evt.which !== 1) return
        if (this.picker && !this.picker.contains(evt.target) && this.state.isOpen) {
            this.setState({isOpen: false}, ()=>{
                document.getElementById('dummy').style.display = 'none'
                this.props.update(this.state.color)
            })
        }
    }

    getHtmlColor = () => {
        return `rgba(${this.state.color[0]}, ${this.state.color[1]}, ${this.state.color[2]}, ${this.state.color[3]})`
    }

    getPickerColor = () => {
        return {r: this.state.color[0], g: this.state.color[1], b: this.state.color[2], a: this.state.color[3]}
    }

    changeColor = (newColor) => {
        this.setState({color:[newColor.r, newColor.g, newColor.b, newColor.a]})
        this.props.onChange(newColor)
    }
    render() {
        return (
            <div className="picker" ref={el=>this.picker=el}>
              <div
                className="swatch"
                style={{ backgroundColor: this.getHtmlColor()}}
                onClick={() => this.setState({isOpen: !this.state.isOpen}, ()=>{
                    if (this.state.isOpen) {
                        document.getElementById('dummy').style.display="block"
                    } else {
                        document.getElementById('dummy').style.display="none"
                    }
                })}
              />

              {this.state.isOpen && (
                <div className="popover">
                  <RgbaColorPicker color={this.getPickerColor()} onChange={this.changeColor} />
                </div>
              )}
            </div>
          )
    }
  }
