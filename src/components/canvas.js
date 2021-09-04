import { Component } from 'preact'
import { Line, RoundShape, Polygon, TextNode, Curve } from './shapes'
import { getMirroredPoint } from  '../helpers'
import PropertyBox from './propertybox'

const MAX_SCALE = 5
const MIN_SCALE = 0.1
export class Canvas extends Component {
    constructor(props) {
        super(props)
        this.state = {
            tool: props.tool,
            snapping: true,
            width: 0,
            height: 0,
            cellSize: 1.0 * props.cellSize,
            viewBoxBottom: 0.5 * props.cellSize,
            viewBoxLeft: -0.5 * props.cellSize,
            shapes: this.parseStateFromHash(props.stateHash),
            showProperties: false,
            disableToolShortcuts: false,
            drawingProperties: {
                strokeStyle: 'solid',
                strokeWidth: 1,
                arrow: '',
                strokeColor: [0,0,0,1],
                fillColor: [0,0,0,0],
                cornerRadius: 0
            },
            selectedShape: ''
        }
        this.scale = 1
        this.textValue = ''
        this.element = null
        this.tex = {}
        this.pointerDown = false
        this.pointerDownPos = [null, null]
        this.closed = false
        this.eventBuffer = []
        this.cubicBuffer = []
        this.snappingThreshold = this.state.cellSize / 2
        this.tempDrawingObject = () => {}
        this.tempHtmlObject = () => {}
        this.id = 0
        this.history = [JSON.parse(JSON.stringify(this.state.shapes))]
        this.historyPointer = 0
        this.activeId = []
        this.tikz = {}
    }

    generateCode = () => {
        let code = ''
        for (const id of this.activeId) {
            code += this.tikz[id]
        }
        return code
    }

    setTikZ = (id, code) => {
        this.tikz[id] = code
    }

    errorHandler = (deleteId) => {
        let newShapes = {}
        for (let id in this.state.shapes) {
            if (id !== deleteId) {
                newShapes[id] = {...this.state.shapes[id]}
            }
        }
        this.setState({shapes: newShapes})
    }

    parseStateFromHash = (stateHash) => {
        if (stateHash.length > 0) {
            try {
                return JSON.parse(atob(stateHash.slice(1)))
            } catch (err) {
                alert('Cannot restore state from permalink.')
            }
        }
        return {}
    }

    genPermalink = () => {
        return btoa(JSON.stringify(this.state.shapes))
    }

    getSelectedShape = () => {
        return this.state.selectedShape
    }

    cannotUseToolSwitchShortcuts = () => {
        return this.state.disableToolShortcuts
    }

    setSelectedShape = (newShape) => {
        this.setState({selectedShape: newShape})
    }

    togglePropsBar = (val) => {
        this.setState({showProperties: val})
        if (!val) {
            this.setState({snapping:true})
        }
    }

    snapPoints = () => {
        for (let obj of Object.values(this.state.shapes)) {
            if (obj.id.includes('line')) {
                obj.p1 = this.getNearestGridPoint(obj.p1)
                obj.p2 = this.getNearestGridPoint(obj.p2)
            } else if (obj.id.includes('curve')) {
                const newAnchorPoints = obj.anchorPoints.map(p =>this.getNearestGridPoint([p[0], p[1]]))
                obj.anchorPoints = newAnchorPoints
                const newControlPoints = obj.controlPoints.map(p =>this.getNearestGridPoint([p[0], p[1]]))
                obj.controlPoints = newControlPoints
            } else if (obj.id.includes('polygon')) {
                const newPoints = obj.points.map(p =>this.getNearestGridPoint([p[0], p[1]]))
                obj.points = newPoints
            } else if (obj.id.includes('circle')) {
                [obj.cx, obj.cy] = this.getNearestGridPoint([obj.cx, obj.cy])
                const newRx = Math.floor(obj.rx / this.snappingThreshold) * this.snappingThreshold
                const newRy = Math.floor(obj.ry / this.snappingThreshold) * this.snappingThreshold
                obj.rx = obj.rx - newRx > 0.5*this.snappingThreshold? newRx + this.snappingThreshold: newRx
                obj.ry = obj.ry - newRy > 0.5*this.snappingThreshold? newRy + this.snappingThreshold: newRy

            } else if (obj.id.includes('text')) {
                [obj.x, obj.y] = this.getNearestGridPoint([obj.x, obj.y])
            }
        }
        this.updateHistory()
        this.forceUpdate()
    }


    toggleSnapping = () => {
        this.setState({
            snapping: !this.state.snapping
        }, ()=>{
            if (this.state.snapping) {
                this.snapPoints()
            }
        })
    }

    strokeChange = evt => {
        if (this.props.tool === 'select' && this.state.selectedShape !== '') {
            this.state.shapes[this.state.selectedShape].strokeStyle = evt.target.value
            this.updateHistory()
        } else {
            this.state.drawingProperties.strokeStyle = evt.target.value
        }
        this.forceUpdate()
    }

    arrowChange = evt => {
        if (this.props.tool === 'select' && this.state.selectedShape !== '') {
            this.state.shapes[this.state.selectedShape].arrow = evt.target.value
            this.updateHistory()
        } else {
            this.state.drawingProperties.arrow = evt.target.value
        }
        this.forceUpdate()
    }

    weightChange = evt => {
        if (evt.target.value === '') return
        if (this.props.tool === 'select' && this.state.selectedShape !== '') {
            this.state.shapes[this.state.selectedShape].strokeWidth = evt.target.value
            this.updateHistory()
        } else {
            this.state.drawingProperties.strokeWidth = evt.target.value
        }
        this.forceUpdate()
    }

    strokeColorChange = color => {
        const colorArray = [color.r, color.g, color.b, color.a]
        if (this.props.tool === 'select' && this.state.selectedShape !== '') {
            this.state.shapes[this.state.selectedShape].strokeColor = [...colorArray]
            this.updateHistory()
        } else {
            this.state.drawingProperties.strokeColor = [...colorArray]
        }
        this.forceUpdate()
    }

    fillColorChange = color => {
        const colorArray = [color.r, color.g, color.b, color.a]
        if (this.props.tool === 'select' && this.state.selectedShape !== '') {
            this.state.shapes[this.state.selectedShape].fillColor = [...colorArray]
            this.updateHistory()
        } else {
            this.state.drawingProperties.fillColor = [...colorArray]
        }
        this.forceUpdate()
    }

    deleteShape = () => {
        if (this.state.selectedShape === '') return
        let newShapes = {}
        for (let id in this.state.shapes) {
            if (id !== this.state.selectedShape) {
                newShapes[id] = {...this.state.shapes[id]}
            }
        }
        this.setState({selectedShape: '', showProperties:false, shapes: newShapes}, ()=>{this.updateHistory()})

    }

    cornerRadiusChange = evt => {
        if (evt.target.value === '') return
        if (this.props.tool === 'select' && this.state.selectedShape !== '' && this.state.selectedShape.includes('polygon')) {
            this.state.shapes[this.state.selectedShape].cornerRadius = evt.target.value
            this.updateHistory()
        } else {
            this.state.drawingProperties.cornerRadius = evt.target.value
        }
        this.forceUpdate()
    }

    textChange = evt => {
        if (this.props.tool === 'select' && this.state.selectedShape.includes('text')) {
            this.state.shapes[this.state.selectedShape].text = evt.target.value.slice()
            this.updateHistory()
        }
        this.forceUpdate()
    }

    getID = (shape) => {
        return "canvas-shape-" + shape + '-' + this.id++
    }

    updateSize = () => {
        const {width, height} = this.element.getBoundingClientRect()
        this.setState({width, height})
    }

    afterDrawUpdate = () => {
        this.pointerDown = false
        this.closed = false
        this.eventBuffer = []
        this.cubicBuffer = []
        this.setState({disableToolShortcuts: false})
        this.tempDrawingObject = () => {}
        this.tempHtmlObject = () => {}
        this.forceUpdate()
    }

    updateState = (id, newState) => {
        let needToUpdate = false
        for (let prop in newState) {
            if (this.state.shapes[id][prop] != newState[prop]){
                needToUpdate = true
                break
            }
        }
        if (needToUpdate) {
            this.setState(prevState => {
                let shapes = JSON.parse(JSON.stringify(prevState.shapes))
                for (let prop in newState) {
                    shapes[id][prop] = JSON.parse(JSON.stringify(newState[prop]))
                }
                return { shapes }
            }, ()=>{this.updateHistory()})
        } else {
            this.updateHistory()
        }
    }

    updateHistory = () => {
        if (this.historyPointer != this.history.length - 1) {
            this.history = this.history.splice(0, this.historyPointer + 1)
        }
        this.history.push(JSON.parse(JSON.stringify(this.state.shapes)))
        this.historyPointer++
        this.activeId = [...Object.keys(this.state.shapes)]
        for (let id in this.tikz) {
            if (!this.activeId.includes(id)) {
                delete(this.tikz[id])
            }
        }
    }

    getNearestGridPoint = (p) => {
        let [x, y] = p
        const newX = Math.floor(x / this.snappingThreshold) * this.snappingThreshold
        x = x - newX > 0.5 * this.snappingThreshold ? newX + this.snappingThreshold : newX
        const newY = Math.floor(y / this.snappingThreshold) * this.snappingThreshold
        y = y - newY > 0.5 * this.snappingThreshold ? newY + this.snappingThreshold : newY
        return [x, y]
    }

    getCoordinates = (evt, snapping) => {
        let x = evt.clientX * this.scale + this.state.viewBoxLeft
        let y = evt.clientY * this.scale + this.state.viewBoxBottom - this.state.height
        if (snapping) {
            return this.getNearestGridPoint([x, y])
        }
        return [x, y]
    }

    handlePointerDown = (evt) => {
        evt.preventDefault()
        if (evt.which !== 1) return
        this.pointerDown = true
        if (this.props.tool === "pan") {
            this.pointerDownPos = this.getCoordinates(evt, false)
        } else if (this.props.tool === "roundShape") {
            const [posX, posY] = this.getCoordinates(evt, this.state.snapping)
            if (this.eventBuffer.length == 0) {
                this.eventBuffer.push([posX, posY])
            } else {
                const radius = Math.sqrt(Math.pow(posX - this.eventBuffer[0][0], 2) + Math.pow(posY - this.eventBuffer[0][1], 2))
                const id = this.getID('circle')
                this.state.shapes[id] = {id: id,
                    cx: this.eventBuffer[0][0],
                    cy: this.eventBuffer[0][1],
                    rx: radius,
                    ry: radius,
                    strokeStyle: this.state.drawingProperties.strokeStyle,
                    strokeWidth: this.state.drawingProperties.strokeWidth,
                    strokeColor: this.state.drawingProperties.strokeColor,
                    fillColor:this.state.drawingProperties.fillColor}
                this.updateHistory()
                this.afterDrawUpdate()
            }
        } else if (this.props.tool === "polygon") {
            const [posX, posY] = this.getCoordinates(evt, this.state.snapping)
            if (this.eventBuffer.length > 0 && posX == this.eventBuffer[0][0] && posY == this.eventBuffer[0][1]) {
                const id = this.getID('polygon')
                this.state.shapes[id] = {
                    id: id,
                    points: this.eventBuffer,
                    strokeStyle: this.state.drawingProperties.strokeStyle,
                    strokeWidth: this.state.drawingProperties.strokeWidth,
                    strokeColor: this.state.drawingProperties.strokeColor,
                    fillColor: this.state.drawingProperties.fillColor,
                    cornerRadius: this.state.drawingProperties.cornerRadius
                }
                this.updateHistory()
                this.afterDrawUpdate()
            } else {
                this.eventBuffer.push([posX, posY])
            }
        } else if (this.props.tool === "line") {
            const [posX, posY] = this.getCoordinates(evt, this.state.snapping)
            if (this.eventBuffer.length == 0) {
                this.eventBuffer.push([posX, posY])
            } else {
                const id = this.getID('line')
                this.state.shapes[id] = {
                    id: id,
                    p1: this.eventBuffer[0],
                    p2: [posX, posY],
                    arrow: this.state.drawingProperties.arrow,
                    strokeStyle: this.state.drawingProperties.strokeStyle,
                    strokeWidth: this.state.drawingProperties.strokeWidth,
                    strokeColor:this.state.drawingProperties.strokeColor
                }
                this.updateHistory()
                this.afterDrawUpdate()
            }
        } else if (this.props.tool === "curve") {
            const [posX, posY] = this.getCoordinates(evt, this.state.snapping)
            if (this.eventBuffer.length === 0) {
                this.eventBuffer.push([posX, posY])
                this.pointerDown = true
            } else if (posX == this.eventBuffer[0][0] && posY == this.eventBuffer[0][1]) {
                this.eventBuffer.push([posX, posY])
                this.closed = true
            } else {
                this.eventBuffer.push([posX, posY])
            }
        } else if (this.props.tool === "text") {
            const [posX, posY] = this.getCoordinates(evt, this.state.snapping)
            if (this.eventBuffer.length == 0) {
                this.eventBuffer.push([posX, posY])
                const style = {left: evt.clientX - 60, top: evt.clientY - 15}
                this.tempHtmlObject = () =>
                    <form class="edit" style={style} onSubmit={this.handleSubmit}>
                        <input
                            ref={el => this.textInput = el}
                            value={this.textValue}
                            onKeyDown={this.editKeyDown}
                            onPointerDown={this.stopPropagation}
                            onChange={this.editChange} type="text"
                        />
                        <p>Please do NOT put TeX commands outside $$</p>
                    </form>
                this.setState({disableToolShortcuts: true})
                this.forceUpdate()
            }
        }
    }

    handlePointerUp = (evt) => {
        evt.preventDefault()
        if (!this.pointerDown) return
        this.pointerDown = false
        if (this.props.tool === 'curve' && this.eventBuffer.length > 0) {
            const [posX, posY] = this.getCoordinates(evt, this.state.snapping)
            if (!this.closed) {
                if (this.eventBuffer.length === 1) {
                    this.cubicBuffer.push([posX, posY])
                } else {
                    const lastAnchor = this.eventBuffer[this.eventBuffer.length-1]
                    this.cubicBuffer.push(getMirroredPoint([posX, posY], lastAnchor))
                    this.cubicBuffer.push([posX, posY])
                }
            } else {
                const lastAnchor = this.eventBuffer[this.eventBuffer.length-1]
                this.cubicBuffer.push(getMirroredPoint([posX, posY], lastAnchor))
                this.createCurve(true)
                this.updateHistory()
                this.afterDrawUpdate()
            }
        }
    }

    handlePointerMove = (evt) => {
        evt.preventDefault()

        if (this.props.tool === "roundShape" && this.eventBuffer.length != 0) {
            const [posX, posY] = this.getCoordinates(evt, this.state.snapping)
            const radius = Math.sqrt(Math.pow(posX - this.eventBuffer[0][0], 2) + Math.pow(posY - this.eventBuffer[0][1], 2))
            this.tempDrawingObject = () => <circle cx={this.eventBuffer[0][0]} cy={this.eventBuffer[0][1]} r={radius} style="stroke:rgba(128,128,128,0.5);stroke-width:0.5;fill:none"/>
            this.forceUpdate()
        } else if (this.props.tool === "line" && this.eventBuffer.length != 0) {
            const [posX, posY] = this.getCoordinates(evt, this.state.snapping)
            this.tempDrawingObject = () => <line x1={this.eventBuffer[0][0]} y1={this.eventBuffer[0][1]} x2={posX} y2={posY} style="stroke:rgba(128,128,128,0.5);stroke-width:0.5"/>
            this.forceUpdate()
        } else if (this.props.tool === "polygon" && this.eventBuffer.length != 0) {
            const temp = []
            const len = this.eventBuffer.length
            if (len > 1) {
                for (let i = 0; i < len - 1; i++) {
                    temp.push(<line  x1={this.eventBuffer[i][0]} y1={this.eventBuffer[i][1]} x2={this.eventBuffer[i+1][0]} y2={this.eventBuffer[i+1][1]} style="stroke:rgb(0,0,0);stroke-width:0.5"/>)
                }
            }
            const [posX, posY] = this.getCoordinates(evt, this.state.snapping)
            temp.push(<line x1={this.eventBuffer[len-1][0]} y1={this.eventBuffer[len-1][1]} x2={posX} y2={posY} style="stroke:rgba(128,128,128,0.5);stroke-width:0.5"/>)
            this.tempDrawingObject = () => temp
            this.forceUpdate()
        } else if (this.pointerDown && this.props.tool ===  "pan") {
            const [posX, posY] = this.getCoordinates(evt, false)
            const offsetX = (posX - this.pointerDownPos[0])
            const offsetY = (posY - this.pointerDownPos[1])

            this.setState({
                viewBoxLeft: this.state.viewBoxLeft - offsetX,
                viewBoxBottom: this.state.viewBoxBottom - offsetY
            })
        } else if (this.props.tool === "curve" && this.eventBuffer.length != 0) {
            const [posX, posY] = this.getCoordinates(evt, this.state.snapping)
            const temp = []

            if (!this.pointerDown) {
                let tempSolidDef = `M ${this.eventBuffer[0][0]},${this.eventBuffer[0][1]} `
                let tempThinDef = `M ${this.eventBuffer[this.eventBuffer.length-1][0]},${this.eventBuffer[this.eventBuffer.length-1][1]} `
                for (let i = 1; i < this.eventBuffer.length; i++) {
                    tempSolidDef += `C ${this.cubicBuffer[2*i-2][0]},${this.cubicBuffer[2*i-2][1]} ${this.cubicBuffer[2*i-1][0]},${this.cubicBuffer[2*i-1][1]} ${this.eventBuffer[i][0]},${this.eventBuffer[i][1]} `
                }
                tempThinDef += `C ${this.cubicBuffer[this.cubicBuffer.length-1][0]},${this.cubicBuffer[this.cubicBuffer.length-1][1]} ${posX},${posY} ${posX},${posY} `
                temp.push(<path d={tempSolidDef} style="stroke:rgb(0,0,0);stroke-width:0.5;fill:none" />)
                temp.push(<path d={tempThinDef} style="stroke:rgba(128,128,128,0.5);stroke-width:0.5;fill:none"/>)
            } else {
                if(this.eventBuffer.length >= 2) {
                    let tempSolidDef = `M ${this.eventBuffer[0][0]},${this.eventBuffer[0][1]} `
                    for (let i = 1; i < this.eventBuffer.length - 1; i++) {
                        tempSolidDef += `C ${this.cubicBuffer[2*i-2][0]},${this.cubicBuffer[2*i-2][1]} ${this.cubicBuffer[2*i-1][0]},${this.cubicBuffer[2*i-1][1]} ${this.eventBuffer[i][0]},${this.eventBuffer[i][1]} `
                    }
                    let tempThinDef = `M ${this.eventBuffer[this.eventBuffer.length-2][0]},${this.eventBuffer[this.eventBuffer.length-2][1]} `
                    const lastControlPoint = getMirroredPoint([posX, posY], this.eventBuffer[this.eventBuffer.length-1])
                    tempThinDef += `C ${this.cubicBuffer[this.cubicBuffer.length-1][0]},${this.cubicBuffer[this.cubicBuffer.length-1][1]} ${lastControlPoint[0]},${lastControlPoint[1]} ${this.eventBuffer[this.eventBuffer.length-1][0]},${this.eventBuffer[this.eventBuffer.length-1][1]}`
                    temp.push(<path d={tempSolidDef} style="stroke:rgb(0,0,0);stroke-width:0.5;fill:none" />)
                    temp.push(<path d={tempThinDef} style="stroke:rgba(128,128,128,0.5);stroke-width:0.5;fill:none"/>)
                }
                temp.push(<line x1={this.eventBuffer[this.eventBuffer.length-1][0]} y1={this.eventBuffer[this.eventBuffer.length-1][1]} x2={posX} y2={posY} style="stroke:rgba(128,128,128,0.5);stroke-width:0.5;fill:none" />)
            }
            this.tempDrawingObject = () => temp
            this.forceUpdate()
        }
    }

    handleSubmit = evt => {
        evt.preventDefault()
    }

    createTextNode = () => {
        if (this.textValue === '') return
        const id = this.getID('text')
        this.state.shapes[id] = {
            id: id,
            x: this.eventBuffer[0][0],
            y: this.eventBuffer[0][1],
            text: this.textValue,
            strokeColor: this.state.drawingProperties.strokeColor
        }
        this.textValue = ''
    }

    createCurve = (closed) => {
        if (this.eventBuffer.length === 0) return
        const id = this.getID('curve')
        this.state.shapes[id] = {
            id:id,
            closed: closed,
            anchorPoints:JSON.parse(JSON.stringify(this.eventBuffer)),
            controlPoints:JSON.parse(JSON.stringify(this.cubicBuffer)),
            arrow: this.state.drawingProperties.arrow,
            strokeStyle:this.state.drawingProperties.strokeStyle,
            strokeWidth:this.state.drawingProperties.strokeWidth,
            strokeColor:this.state.drawingProperties.strokeColor,
            fillColor:this.state.drawingProperties.fillColor
        }
    }

    editKeyDown = evt => {
        if (evt.key === 'Enter') {
            evt.stopPropagation()
            this.createTextNode()
            this.updateHistory()
            this.afterDrawUpdate()
        }
    }

    editChange = evt => {
        this.textValue = evt.target.value
    }

    stopPropagation = evt => {
        evt.stopPropagation()
    }

    undo = () => {
        this.afterDrawUpdate()
        if (this.historyPointer > 0) {
            this.historyPointer--
            this.setState({
                shapes: JSON.parse(JSON.stringify(this.history[this.historyPointer]))
            },
                ()=>{this.activeId = [...Object.keys(this.state.shapes)]})
        }
    }

    redo = () => {
        this.afterDrawUpdate()
        if (this.historyPointer < this.history.length - 1) {
            this.historyPointer++
            this.setState({
                shapes: JSON.parse(JSON.stringify(this.history[this.historyPointer]))
            },
                ()=>{this.activeId = [...Object.keys(this.state.shapes)]})
        }
    }


    handleKeyboardInput = (evt) => {
        if (evt.key === 'Escape') {
            if (this.state.selectedShape != '') {
                this.setState({
                    selectedShape: '',
                    showProperties: false
                })
            }
            this.afterDrawUpdate()
        } else if (evt.key === 'Delete' || evt.key === 'Backspace') {
            this.deleteShape()
        } else if (evt.key === 'Enter' && this.props.tool === 'curve') {
            if (this.pointerDown) {
                this.eventBuffer.pop()
            }
            this.createCurve(false)
            this.updateHistory()
            this.afterDrawUpdate()
        }
    }

    handleZoom = (evt) => {
        evt.preventDefault()
        const pos = this.getCoordinates(evt, false)
        let scale = Math.pow(1.005, event.deltaY)
        if (this.scale * scale < MIN_SCALE) {
            scale = MIN_SCALE / this.scale
            this.scale = MIN_SCALE
        } else if (this.scale * scale > MAX_SCALE) {
            scale = MAX_SCALE / this.scale
            this.scale = MAX_SCALE
        } else {
            this.scale *= scale
        }
        const width = scale * this.state.width
        const height = scale * this.state.height
        const viewBoxLeft = pos[0] - scale * (pos[0] - this.state.viewBoxLeft)
        const viewBoxBottom = pos[1] + scale * (this.state.viewBoxBottom - pos[1])

        this.setState({
            width,
            height,
            viewBoxBottom,
            viewBoxLeft
        })
    }

    componentDidMount() {
        this.updateSize()
        let canvas = document.getElementById("grid")
        this.updateSize()
        window.addEventListener('resize', () => this.updateSize())
        canvas.addEventListener('pointerdown', (evt) => this.handlePointerDown(evt))
        canvas.addEventListener('pointerup', (evt) => this.handlePointerUp(evt))
        canvas.addEventListener('pointermove', (evt) => this.handlePointerMove(evt))
        canvas.addEventListener('wheel', (evt)=>{this.handleZoom(evt)})
        window.addEventListener('keydown', (evt) => this.handleKeyboardInput(evt))
    }

    componentDidUpdate(prevProps) {
        if (this.textInput != null) {
            this.textInput.select()
        }
        if (prevProps.tool !== this.props.tool) {
            this.setState({
                tool:this.props.tool
            })
            if (!['pan', 'select'].includes(this.props.tool)) {
                this.setState({
                    selectedShape: ''
                })
            }
        }
    }

    render() {
        const viewBox = [this.state.viewBoxLeft, this.state.viewBoxBottom - this.state.height, this.state.width, this.state.height].join(' ')
        const topGridY = Math.floor((this.state.viewBoxBottom - this.state.height) / this.state.cellSize) * this.state.cellSize
        const leftGridX = Math.floor(Math.ceil(this.state.viewBoxLeft) / this.state.cellSize) * this.state.cellSize

        const gridLines = []
        for (let i = 0; topGridY + i * this.state.cellSize < this.state.viewBoxBottom; i++) {
            if (topGridY + i * this.state.cellSize == 0) {
                gridLines.push(
                    <line
                        class="grid-line"
                        x1={this.state.viewBoxLeft}
                        y1={topGridY + i * this.state.cellSize}
                        x2={this.state.viewBoxLeft + this.state.width}
                        y2={topGridY + i * this.state.cellSize}
                        style="stroke:rgb(128,128,128);stroke-width:1"
                    />)
            } else {
                gridLines.push(
                    <line
                        class="grid-line"
                        x1={this.state.viewBoxLeft}
                        y1={topGridY + i * this.state.cellSize}
                        x2={this.state.viewBoxLeft + this.state.width}
                        y2={topGridY + i * this.state.cellSize}
                        style="stroke:rgb(128,128,128);stroke-width:0.25"
                    />)
            }
        }
        for (let i = 0; leftGridX + i * this.state.cellSize < this.state.viewBoxLeft + this.state.width; i++) {
            if (leftGridX + i * this.state.cellSize == 0) {
                gridLines.push(
                    <line
                        class="grid-line"
                        x1={leftGridX + i * this.state.cellSize}
                        y1={this.state.viewBoxBottom - this.state.height - 0.25}
                        x2={leftGridX + i * this.state.cellSize}
                        y2={this.state.viewBoxBottom + 0.25}
                        style="stroke:rgb(128,128,128);stroke-width:1"
                    />)
            } else {
                gridLines.push(
                    <line
                        class="grid-line"
                        x1={leftGridX + i * this.state.cellSize}
                        y1={this.state.viewBoxBottom - this.state.height - 0.25}
                        x2={leftGridX + i * this.state.cellSize}
                        y2={this.state.viewBoxBottom + 0.25}
                        style="stroke:rgb(128,128,128);stroke-width:0.25"
                    />)
            }
        }

        let renderShapesBuffer = []
        for (let obj of Object.values(this.state.shapes)) {
            if (obj.id.includes('line')) {
                renderShapesBuffer.push(
                    <Line
                        tool={this.state.tool}
                        key={obj.id} id={obj.id}
                        p1={obj.p1}
                        p2={obj.p2}
                        strokeStyle={obj.strokeStyle}
                        arrow={obj.arrow}
                        strokeWidth={obj.strokeWidth}
                        strokeColor={obj.strokeColor}
                        getCoordinates={this.getCoordinates}
                        updateState={this.updateState}
                        togglePropsBar={this.togglePropsBar}
                        getSelectedShape={this.getSelectedShape}
                        setSelectedShape={this.setSelectedShape}
                        snapping={this.state.snapping}
                        setTikZ={this.setTikZ}
                    />
                )
            } else if (obj.id.includes('circle')) {
                renderShapesBuffer.push(
                    <RoundShape
                        tool={this.state.tool}
                        key={obj.id} id={obj.id}
                        cx={obj.cx}
                        cy={obj.cy}
                        rx={obj.rx}
                        ry={obj.ry}
                        strokeStyle={obj.strokeStyle}
                        strokeWidth={obj.strokeWidth}
                        strokeColor={obj.strokeColor}
                        fillColor={obj.fillColor}
                        getCoordinates={this.getCoordinates}
                        updateState={this.updateState}
                        togglePropsBar={this.togglePropsBar}
                        getSelectedShape={this.getSelectedShape}
                        setSelectedShape={this.setSelectedShape}
                        snapping={this.state.snapping}
                        setTikZ={this.setTikZ}
                    />
                )
            } else if (obj.id.includes('polygon')) {
                renderShapesBuffer.push(
                    <Polygon
                        tool={this.state.tool}
                        key={obj.id} id={obj.id}
                        points={obj.points}
                        strokeStyle={obj.strokeStyle}
                        strokeWidth={obj.strokeWidth}
                        strokeColor={obj.strokeColor}
                        fillColor={obj.fillColor}
                        cornerRadius={obj.cornerRadius}
                        getCoordinates={this.getCoordinates}
                        updateState={this.updateState}
                        togglePropsBar={this.togglePropsBar}
                        getSelectedShape={this.getSelectedShape}
                        setSelectedShape={this.setSelectedShape}
                        snapping={this.state.snapping}
                        setTikZ={this.setTikZ}
                    />
                )
            } else if (obj.id.includes('text')) {
                renderShapesBuffer.push(
                    <TextNode
                        tool={this.state.tool}
                        key={obj.id} id={obj.id}
                        x={obj.x}
                        y={obj.y}
                        text={obj.text}
                        color={obj.strokeColor}
                        getCoordinates={this.getCoordinates}
                        updateState={this.updateState}
                        togglePropsBar={this.togglePropsBar}
                        getSelectedShape={this.getSelectedShape}
                        setSelectedShape={this.setSelectedShape}
                        errorHandler={this.errorHandler}
                        snapping={this.state.snapping}
                        scale={this.scale}
                        setTikZ={this.setTikZ}
                    />
                )
            } else if (obj.id.includes('curve')) {
                renderShapesBuffer.push(
                    <Curve
                        tool={this.state.tool}
                        key={obj.id} id={obj.id}
                        closed={obj.closed}
                        anchorPoints={obj.anchorPoints}
                        controlPoints={obj.controlPoints}
                        strokeStyle={obj.strokeStyle}
                        arrow={obj.arrow}
                        strokeWidth={obj.strokeWidth}
                        strokeColor={obj.strokeColor}
                        fillColor={obj.fillColor}
                        getCoordinates={this.getCoordinates}
                        updateState={this.updateState}
                        togglePropsBar={this.togglePropsBar}
                        getSelectedShape={this.getSelectedShape}
                        setSelectedShape={this.setSelectedShape}
                        snapping={this.state.snapping}
                        setTikZ={this.setTikZ}
                    />
                )
            }
        }
        return (<>
        <section ref={el => this.element = el} id="grid">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox={viewBox}>
                {gridLines}
                {renderShapesBuffer}
                {this.tempDrawingObject()}
            </svg>
            {this.tempHtmlObject()}
        </section>
        {this.state.showProperties &&
        <PropertyBox
            tool={this.props.tool}
            id={this.state.selectedShape}
            params={this.props.tool==='select'&&this.state.selectedShape!==''?{...this.state.shapes[this.state.selectedShape]}:{...this.state.drawingProperties}}
            onArrowChange={this.arrowChange}
            onStrokeStyleChange={this.strokeChange}
            onWeightChange={this.weightChange}
            onCornerRadiusChange={this.cornerRadiusChange}
            onStrokeColorChange={this.strokeColorChange}
            onFillColorChange={this.fillColorChange}
            onTextChange={this.textChange}
            onDelete={this.deleteShape}
            snapping={this.state.snapping}
            toggleSnapping={this.toggleSnapping}
        />}
        </>)
    }
}
