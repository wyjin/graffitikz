import { Component } from 'preact'
import TexToSVG from '../latex'
import parse from 'html-react-parser'
import { randString, pointsNeq, colorsNeq, getAnchorPoint } from '../helpers'

class Color {
    constructor(r, g, b, a=1) {
        this.r = r
        this.g = g
        this.b = b
        this.a = a
    }

    htmlColor() {
        return `rgba(${this.r},${this.g},${this.b},${this.a})`
    }

    tikzColor() {
        return `{rgb,255:red,${this.r};green,${this.g};blue,${this.b}}`
    }

    tikzAlpha() {
        return `${this.a}`
    }
}


class Point extends Component {
    constructor(props) {
        super(props)
        this.state = {
            x: props.x,
            y: props.y,
            id: randString(),
        }
        this.posBuffer = null
    }

    componentDidMount() {
        this.mounted = true
        let self = document.getElementById(this.state.id)
        let canvas = document.getElementById('grid')
        self.addEventListener('pointerdown', evt=>this.handlePointerDown(evt))
        canvas.addEventListener('pointermove', evt=>this.handlePointerMove(evt))
        canvas.addEventListener('pointerup', evt=>this.handlePointerUp(evt))
    }

    componentDidUpdate(nextProps) {
        if (this.mounted && (this.state.x != nextProps.x || this.state.y!= nextProps.y)) {
            this.setState({
                x: nextProps.x,
                y: nextProps.y
            })
        }
    }

    handlePointerDown(evt) {
        evt.stopPropagation()
        this.posBuffer = [...this.props.getCoordinates(evt, this.props.snapping)]
        this.pointerDownPos = [...this.props.getCoordinates(evt, this.props.snapping)]
    }

    handlePointerMove(evt) {
        evt.stopPropagation()
        if (this.mounted && this.posBuffer) {
            const [posX, posY] = this.props.getCoordinates(evt, this.props.snapping)
            const [offsetX, offsetY] = [posX-this.posBuffer[0], posY - this.posBuffer[1]]
            this.posBuffer = [posX, posY]
            this.setState({
                x: this.state.x + offsetX,
                y: this.state.y + offsetY
            })
            this.props.updatePoint(offsetX, offsetY)
        }

    }

    handlePointerUp(evt) {
        evt.preventDefault()
        if (this.pointerDownPos) {
            const [posX, posY] = this.props.getCoordinates(evt, this.props.snapping)
            if (pointsNeq([posX, posY], this.pointerDownPos)) {
                this.props.updateState()
            }
            this.posBuffer = null
            this.pointerDownPos = null
        }
    }

    componentWillUnmount() {
        this.mounted = false
    }

    render() {
        const style=`stroke:#222;fill:#fff;stroke-width:1`
        if (this.props.anchor)
            return <rect id={this.state.id} x={this.state.x-5} y={this.state.y-5} height='10' width='10' visibility={this.props.show?'visible':'hidden'} style={style}/>
        else
            return <circle id={this.state.id} cx={this.state.x} cy={this.state.y} r='5' visibility={this.props.show?'visible':'hidden'} style={style}/>
    }
}


export class Line extends Component {
    constructor(props) {
        super(props)
        this.state = {
            snapping: props.snapping,
            id: props.id,
            p1: props.p1,
            p2: props.p2,
            strokeColor: new Color(...props.strokeColor),
            strokeWidth: 2*props.strokeWidth,
            strokeStyle: props.strokeStyle,
            arrow: props.arrow,
            shadow: 'hidden',
            selected: false,
        }
        this.posBuffer = null
        this.hookToUpdatePoint
        this.updateStateHook
    }

    hookToUpdatePoint = (p) => {
        return (x, y) => {
            p[0] += x
            p[1] += y
            this.forceUpdate()
        }
    }

    updateStateHook = () => {
        this.props.updateState(this.state.id, {
            p1: this.state.p1,
            p2: this.state.p2
        })
    }

    componentDidMount() {
        this.mounted = true
        let self = document.getElementById(this.state.id)
        let canvas = document.getElementById('grid')
        self.addEventListener('mouseenter', (evt)=>this.handleMouseHover(evt))
        self.addEventListener('mouseleave', (evt)=>this.handleMouseLeave(evt))
        canvas.addEventListener('pointermove', (evt)=>this.handleMove(evt))
        canvas.addEventListener('pointerdown', (evt)=>this.handlePointerDown(evt))
        canvas.addEventListener('pointerup', (evt)=>this.handleMoveEnd(evt))

        this.props.setTikZ(this.state.id, this.toTikZ())
    }

    handlePointerDown(evt) {
        evt.preventDefault()
        if (evt.which != 1) return
        if (this.mounted && this.props.tool === 'select'  && this.node && this.node.contains(evt.target)) {
            this.setState({selected: true})
            this.props.setSelectedShape(this.state.id)
            this.props.togglePropsBar(true)
            this.posBuffer = [...this.props.getCoordinates(evt, this.props.snapping)]
            this.pointerDownPos = [... this.props.getCoordinates(evt, this.props.snapping)]
        } else if (this.mounted && this.props.tool === 'select' && this.state.selected ) {
            this.setState({selected:false, shadow:'hidden'})
            if (this.props.getSelectedShape() === this.state.id) {
                this.props.setSelectedShape('')
                this.props.togglePropsBar(false)
            }
        }
    }

    handleMove(evt) {
        evt.preventDefault()
        if (this.mounted && this.posBuffer) {
            const [posX, posY] = this.props.getCoordinates(evt, this.props.snapping)
            const [offsetX, offsetY] = [posX-this.posBuffer[0], posY - this.posBuffer[1]]
            this.posBuffer = [posX, posY]
            this.setState({
                p1: [this.state.p1[0] + offsetX, this.state.p1[1] + offsetY],
                p2: [this.state.p2[0] + offsetX, this.state.p2[1] + offsetY],
            })
        }
    }

    handleMoveEnd(evt) {
        evt.preventDefault()
        if (this.pointerDownPos) {
            const [posX, posY] = this.props.getCoordinates(evt, this.props.snapping)
            if (pointsNeq([posX, posY], this.pointerDownPos)) {
                this.props.updateState(this.state.id, {
                    p1: this.state.p1,
                    p2: this.state.p2
                })
            }
            this.posBuffer = null
            this.pointerDownPos = null
        }
    }

    handleMouseHover(evt) {
        evt.preventDefault()
        if (this.mounted && this.props.tool === 'select') {
            this.setState({shadow:'visible'})
        }
    }



    handleMouseLeave(evt) {
        evt.preventDefault()
        if (this.mounted && !this.state.selected) {
            this.setState({shadow:'hidden'})
        }
    }

    componentDidUpdate(prevProps) {
        if (!this.mounted) return
        if (prevProps.tool !== this.props.tool) {
            if (this.props.tool === 'select' && this.props.getSelectedShape() === this.state.id) {
                this.setState({
                    selected: true,
                    shadow: "visible",
                })
            } else {
                this.setState({
                    selected: false,
                    shadow: "hidden",
                })
            }
        }
        if (pointsNeq(prevProps.p1, this.props.p1)) {
            this.setState({p1: [...this.props.p1]})
        }
        if (pointsNeq(prevProps.p2, this.props.p2)) {
            this.setState({p2: [...this.props.p2]})
        }
        if (prevProps.arrow != this.props.arrow) {
            this.setState({arrow: this.props.arrow})
        }
        if (prevProps.strokeStyle != this.props.strokeStyle) {
            this.setState({strokeStyle: this.props.strokeStyle})
        }
        if (prevProps.strokeWidth != this.props.strokeWidth) {
            this.setState({strokeWidth: 2*this.props.strokeWidth})
        }
        if (colorsNeq(prevProps.strokeColor, this.props.strokeColor)) {
            this.setState({strokeColor: new Color(...this.props.strokeColor)})
        }
        if (prevProps.snapping !== this.props.snapping) {
            this.setState({snapping: this.props.snapping})
        }
        this.props.setTikZ(this.state.id, this.toTikZ())
    }

    componentWillUnmount() {
        this.mounted = false
        this.selected = false
        if (this.props.getSelectedShape === this.state.id) {
            this.props.setSelectedShape('')
            this.props.togglePropsBar(false)
        }
    }

    toTikZ() {
        return `\\draw[${this.state.strokeStyle}, draw=${this.state.strokeColor.tikzColor()}, draw opacity=${this.state.strokeColor.tikzAlpha()}, line width=${this.state.strokeWidth/2}, ${this.state.arrow}] (${this.state.p1[0]},${-this.state.p1[1]}) -- (${this.state.p2[0]},${-this.state.p2[1]});\n`
    }

    render() {
        const style = `stroke:${this.state.strokeColor.htmlColor()};stroke-width:${this.state.strokeWidth};fill:none`
        const shadowStyle = `stroke:#ccc;stroke-width:${Math.min(this.state.strokeWidth*10, this.state.strokeWidth+10)};fill:none`
        const arrowSize = 15 + 1.5*this.state.strokeWidth
        const arrowDef = `M ${-arrowSize} ${-arrowSize} A ${arrowSize} ${arrowSize} 0 0 0 0 0 A ${arrowSize} ${arrowSize} 0 0 0 ${-arrowSize} ${arrowSize}`
        const viewBox = `${-arrowSize - 0.5*this.state.strokeWidth} ${-arrowSize- 0.5*this.state.strokeWidth} ${arrowSize + 2*this.state.strokeWidth} ${2*arrowSize + 2*this.state.strokeWidth}`
        const markerRef = `url(#${this.state.id + '-arrow'})`
        const strokeStyle = this.state.strokeStyle === 'dashed'? '8 8' : ''
        return (
            <g ref={el=>this.node=el} id={this.state.id}>
                <defs>
                    <marker id={this.state.id + '-arrow'} viewBox={viewBox} refX="0" refY="0" markerHeight={arrowSize + 2*this.state.strokeWidth} markerWidth={2*arrowSize + 2*this.state.strokeWidth} orient="auto-start-reverse" markerUnits='userSpaceOnUse'>
                        <path d={arrowDef} style={style} strokeLinecap="round" strokeLinejoin="round"/>
                    </marker>
                </defs>
                <line x1={this.state.p1[0]} y1={this.state.p1[1]} x2={this.state.p2[0]} y2={this.state.p2[1]} style={shadowStyle} visibility={this.state.shadow}/>
                <line x1={this.state.p1[0]} y1={this.state.p1[1]} x2={this.state.p2[0]} y2={this.state.p2[1]} style={style} markerEnd={this.state.arrow !== '' ? markerRef: ''} markerStart={this.state.arrow === '<->'? markerRef: ''} strokeDasharray={strokeStyle}/>

                <Point
                    x={this.state.p1[0]}
                    y={this.state.p1[1]}
                    show={this.state.selected}
                    updatePoint={this.hookToUpdatePoint(this.state.p1)}
                    getCoordinates={this.props.getCoordinates}
                    updateState={this.updateStateHook}
                    snapping={this.state.snapping}
                    anchor={true}
                />
                <Point
                    x={this.state.p2[0]}
                    y={this.state.p2[1]}
                    show={this.state.selected}
                    updatePoint={this.hookToUpdatePoint(this.state.p2)}
                    getCoordinates={this.props.getCoordinates}
                    updateState={this.updateStateHook}
                    snapping={this.state.snapping}
                    anchor={true}
                />
            </g>
        )
    }
}


export class RoundShape extends Component {
    constructor(props) {
        super(props)
        this.state = {
            snapping: props.snapping,
            id: props.id,
            cx: props.cx * 1,
            cy: props.cy * 1,
            rx: props.rx * 1,
            ry: props.ry * 1,
            strokeColor: new Color(...props.strokeColor),
            strokeWidth: 2*props.strokeWidth,
            fillColor: new Color(...props.fillColor),
            shadow: 'hidden',
            selected: false,
            bottomAnchor: [props.cx, props.cy+props.ry],
            rightAnchor: [props.cx +props.rx, props.cy],
        }
    }

    hookToUpdateBottomAnchor = (_, y) => {
        if (this.state.ry + y > 1) {
            this.state.bottomAnchor[1] += y
            this.state.ry += y
        } else {
            this.state.bottomAnchor[1] = this.state.cy+1
            this.state.ry =1
        }
        this.forceUpdate()
    }

    hookToUpdateRightAnchor = (x, _) => {
        if (this.state.rx + x > 1) {
            this.state.rightAnchor[0] += x
            this.state.rx += x
        } else {
            this.state.rightAnchor[0] = this.state.cx+1
            this.state.rx =1
        }
        this.forceUpdate()
    }

    updateStateHook = () => {
        this.props.updateState(this.state.id, {
            rx: this.state.rx,
            ry: this.state.ry
        })
    }

    componentDidMount() {
        this.mounted = true
        let self = document.getElementById(this.state.id)
        let canvas = document.getElementById('grid')
        self.addEventListener('mouseenter', (evt)=>this.handleMouseHover(evt))
        self.addEventListener('mouseleave', (evt)=>this.handleMouseLeave(evt))
        canvas.addEventListener('pointermove', (evt)=>this.handleMove(evt))
        canvas.addEventListener('pointerdown', (evt)=>this.handlePointerDown(evt))
        canvas.addEventListener('pointerup', (evt)=>this.handleMoveEnd(evt))
        this.props.setTikZ(this.state.id, this.toTikZ())
    }

    handlePointerDown(evt) {
        evt.preventDefault()
        if (evt.which != 1) return
        if (this.mounted && this.props.tool === 'select'  && this.node && this.node.contains(evt.target)) {
            this.setState({selected: true})
            this.props.setSelectedShape(this.state.id)

            this.props.togglePropsBar(true)
            this.posBuffer = [...this.props.getCoordinates(evt, this.props.snapping)]
            this.pointerDownPos = [... this.props.getCoordinates(evt, this.props.snapping)]
        } else if (this.mounted && this.props.tool === 'select' && this.state.selected ) {
            this.setState({selected:false, shadow:'hidden'})
            if (this.props.getSelectedShape() === this.state.id) {
                this.props.setSelectedShape('')
                this.props.togglePropsBar(false)
            }
        }
    }

    handleMove(evt) {
        evt.preventDefault()
        if (this.mounted && this.posBuffer) {
            const [posX, posY] = this.props.getCoordinates(evt, this.props.snapping)
            const [offsetX, offsetY] = [posX-this.posBuffer[0], posY - this.posBuffer[1]]
            this.posBuffer = [posX, posY]
            this.setState({
                cx: this.state.cx + offsetX,
                cy: this.state.cy + offsetY,
                bottomAnchor: [this.state.bottomAnchor[0] + offsetX, this.state.bottomAnchor[1] + offsetY],
                rightAnchor: [this.state.rightAnchor[0] + offsetX, this.state.rightAnchor[1] + offsetY]
            })
        }
    }

    handleMoveEnd(evt) {
        evt.preventDefault()
        if (this.pointerDownPos) {
            const [posX, posY] = this.props.getCoordinates(evt, this.props.snapping)
            if (pointsNeq([posX, posY], this.pointerDownPos)) {
                this.props.updateState(this.state.id, {
                    cx: this.state.cx,
                    cy: this.state.cy
                })
            }
            this.posBuffer = null
            this.pointerDownPos = null
        }
    }

    componentDidUpdate(prevProps) {
        if (!this.mounted) return
        if (prevProps.tool !== this.props.tool) {
            if (this.props.tool === 'select' && this.props.getSelectedShape() === this.state.id) {
                this.setState({
                    selected: true,
                    shadow: "visible",
                })
            } else {
                this.setState({
                    selected: false,
                    shadow: "hidden",
                })
            }
        }
        if (prevProps.cx != this.props.cx) {
            this.setState((state) => ({
                cx: 1.0*this.props.cx,
                bottomAnchor: [this.props.cx, state.cy + state.ry],
                rightAnchor: [this.props.cx + state.rx, state.cy]
            }))
        }
        if (prevProps.cy != this.props.cy) {
            this.setState((state) => ({
                cy: 1.0*this.props.cy,
                bottomAnchor: [state.cx, 1.0*this.props.cy+state.ry],
                rightAnchor: [state.cx + state.rx, 1.0*this.props.cy]
            }))
        }
        if (prevProps.rx != this.props.rx) {
            this.setState((state) => ({
                rx: 1.0*this.props.rx,
                rightAnchor: [state.cx + 1.0*this.props.rx, state.cy]
            }))
        }
        if (prevProps.ry != this.props.ry) {
            this.setState((state) => ({
                ry: 1.0*this.props.ry,
                bottomAnchor: [state.cx, state.cy+1.0*this.props.ry],
            }))
        }
        if (colorsNeq(prevProps.strokeColor, this.props.strokeColor)) {
            this.setState({strokeColor: new Color (...this.props.strokeColor)})
        }
        if (prevProps.strokeWidth != this.props.strokeWidth) {
            this.setState({strokeWidth: 2*this.props.strokeWidth})
        }
        if (colorsNeq(prevProps.fillColor, this.props.fillColor)) {
            this.setState({fillColor: new Color (...this.props.fillColor)})
        }
        if (prevProps.snapping !== this.props.snapping) {
            this.setState({snapping: this.props.snapping})
        }
        this.props.setTikZ(this.state.id, this.toTikZ())
    }

    handleMouseHover(evt) {
        evt.preventDefault()
        if (this.mounted && this.props.tool === 'select') {
            this.setState({shadow:'visible'})
        }
    }

    handleMouseLeave(evt) {
        evt.preventDefault()
        if (this.mounted && !this.state.selected) {
            this.setState({shadow:'hidden'})
        }
    }

    toTikZ() {
        return `\\draw[draw=${this.state.strokeColor.tikzColor()}, draw opacity=${this.state.strokeColor.tikzAlpha()}, line width=${this.state.strokeWidth/2}, fill=${this.state.fillColor.tikzColor()}, fill opacity=${this.state.fillColor.tikzAlpha()}] (${this.state.cx},${-this.state.cy}) ellipse (${this.state.rx} and ${this.state.ry});\n`
    }

    componentWillUnmount() {
        this.mounted = false
        this.selected = false
        if (this.props.getSelectedShape === this.state.id) {
            this.props.setSelectedShape('')
            this.props.togglePropsBar(false)
        }
    }

    render() {
        const style = `stroke:${this.state.strokeColor.htmlColor()};stroke-width:${this.state.strokeWidth};fill:${this.state.fillColor.htmlColor()}`
        const shadowStyle = `stroke:#ccc;stroke-width:${Math.min(this.state.strokeWidth*10, this.state.strokeWidth+10)};fill:none;`


        return (
            <g id={this.state.id} ref={el=>this.node=el}>
                <ellipse cx={this.state.cx} cy={this.state.cy} rx={this.state.rx} ry={this.state.ry} style={shadowStyle} visibility={this.state.shadow}/>
                <ellipse cx={this.state.cx} cy={this.state.cy} rx={this.state.rx} ry={this.state.ry} style={style} />
                <Point
                    show={this.state.selected}
                    x={this.state.bottomAnchor[0]}
                    y={this.state.bottomAnchor[1]}
                    updatePoint={this.hookToUpdateBottomAnchor}
                    getCoordinates={this.props.getCoordinates}
                    updateState={this.updateStateHook}
                    snapping={this.state.snapping}
                    anchor={true}
                />
                <Point
                    show={this.state.selected}
                    x={this.state.rightAnchor[0]}
                    y={this.state.rightAnchor[1]}
                    updatePoint={this.hookToUpdateRightAnchor}
                    getCoordinates={this.props.getCoordinates}
                    updateState={this.updateStateHook}
                    snapping={this.state.snapping}
                    anchor={true}
                />
            </g>
        )
    }
}


export class Polygon extends Component {
    constructor(props) {
        super(props)
        this.state = {
            snapping: props.snapping,
            id: props.id,
            points: JSON.parse(JSON.stringify(props.points)),
            strokeColor: new Color(...props.strokeColor),
            strokeWidth: 2.0* props.strokeWidth,
            fillColor: new Color(...props.fillColor),
            cornerRadius: 1.0* props.cornerRadius,
            shadow: 'hidden',
            selected: false
        }
        this.hookToUpdatePoint = this.hookToUpdatePoint
    }

    componentDidMount() {
        this.mounted = true
        let self = document.getElementById(this.state.id)
        let canvas = document.getElementById('grid')
        self.addEventListener('mouseenter', (evt)=>this.handleMouseHover(evt))
        self.addEventListener('mouseleave', (evt)=>this.handleMouseLeave(evt))
        canvas.addEventListener('pointermove', (evt)=>this.handleMove(evt))
        canvas.addEventListener('pointerdown', (evt)=>this.handlePointerDown(evt))
        canvas.addEventListener('pointerup', (evt)=>this.handleMoveEnd(evt))
        this.props.setTikZ(this.state.id, this.toTikZ())
    }

    handlePointerDown(evt) {
        evt.preventDefault()
        if (evt.which != 1) return
        if (this.mounted && this.props.tool === 'select'  && this.node && this.node.contains(evt.target)) {
            this.setState({selected: true})
            this.props.setSelectedShape(this.state.id)
            this.props.togglePropsBar(true)
            this.posBuffer = [...this.props.getCoordinates(evt, this.props.snapping)]
            this.pointerDownPos = [... this.props.getCoordinates(evt, this.props.snapping)]
        } else if (this.mounted && this.props.tool === 'select' && this.state.selected ) {
            this.setState({selected:false, shadow:'hidden'})
            if (this.props.getSelectedShape() === this.state.id) {
                this.props.setSelectedShape('')
                this.props.togglePropsBar(false)
            }
        }
    }

    handleMove(evt) {
        evt.preventDefault()
        if (this.mounted && this.posBuffer) {
            const [posX, posY] = this.props.getCoordinates(evt, this.props.snapping)
            const [offsetX, offsetY] = [posX-this.posBuffer[0], posY - this.posBuffer[1]]
            this.posBuffer = [posX, posY]
            const newPoints = []
            for (let p of this.state.points) {
                newPoints.push([p[0] + offsetX, p[1]+offsetY])
            }
            this.setState({
                points: JSON.parse(JSON.stringify(newPoints))
            })
        }
    }

    handleMoveEnd(evt) {
        evt.preventDefault()
        if (this.pointerDownPos) {
            const [posX, posY] = this.props.getCoordinates(evt, this.props.snapping)
            if (pointsNeq([posX, posY], this.pointerDownPos)) {
                this.props.updateState(this.state.id, {
                    points: this.state.points,
                })
            }
            this.posBuffer = null
            this.pointerDownPos = null
        }
    }

    componentDidUpdate(prevProps) {
        if (!this.mounted) return
        if (prevProps.tool !== this.props.tool) {
            if (this.props.tool === 'select' && this.props.getSelectedShape() === this.state.id) {
                this.setState({
                    selected: true,
                    shadow: "visible",
                })
            } else {
                this.setState({
                    selected: false,
                    shadow: "hidden",
                })
            }
        }
        let needToUpdate = false

        if (prevProps.points.length !== this.props.points.length) {
            needToUpdate = true
        } else {
            for (let i = 0; i < prevProps.points.length; i++) {
                if (pointsNeq(prevProps.points[i], this.props.points[i])) {
                    needToUpdate = true
                    break
                }
            }
        }
        if (needToUpdate) {
            this.setState({points: JSON.parse(JSON.stringify(this.props.points))})
        }
        if (colorsNeq(prevProps.strokeColor, this.props.strokeColor)) {
            this.setState({strokeColor: new Color (...this.props.strokeColor)})
        }
        if (prevProps.strokeWidth != this.props.strokeWidth) {
            this.setState({strokeWidth: 2*this.props.strokeWidth})
        }
        if (prevProps.cornerRadius != this.props.cornerRadius) {
            this.setState({cornerRadius: 1.0 * this.props.cornerRadius})
        }
        if (colorsNeq(prevProps.fillColor, this.props.fillColor)) {
            this.setState({fillColor: new Color (...this.props.fillColor)})
        }
        if (prevProps.snapping !== this.props.snapping) {
            this.setState({snapping: this.props.snapping})
        }
        this.props.setTikZ(this.state.id, this.toTikZ())
    }

    handleMouseHover(evt) {
        evt.preventDefault()
        if (this.mounted && this.props.tool === 'select') {
            this.setState({shadow:'visible'})
        }
    }

    handleMouseLeave(evt) {
        evt.preventDefault()
        if (this.mounted && !this.state.selected) {
            this.setState({shadow:'hidden'})
        }
    }

    toTikZ() {
        const pointsFormat = this.state.points.map(x => `(${x[0]},${-x[1]})`).join(' -- ')
        return `\\draw[rounded corners=${this.state.cornerRadius*0.4}, draw=${this.state.strokeColor.tikzColor()}, draw opacity=${this.state.strokeColor.tikzAlpha()}, line width=${this.state.strokeWidth/2}, fill=${this.state.fillColor.tikzColor()}, fill opacity=${this.state.fillColor.tikzAlpha()}] ${pointsFormat} -- cycle;\n`
    }

    componentWillUnmount() {
        this.mounted = false
        this.selected = false
        if (this.props.getSelectedShape === this.state.id) {
            this.props.setSelectedShape('')
            this.props.togglePropsBar(false)
        }
    }

    hookToUpdatePoint = (p) => {
        return (x, y) => {
            p[0] += x
            p[1] += y
            this.forceUpdate()
        }
    }

    updateStateHook = () => {
        this.props.updateState(this.state.id, {
            points: this.state.points
        })
    }

    render() {
        const style = `stroke:${this.state.strokeColor.htmlColor()};stroke-width:${this.state.strokeWidth};fill:${this.state.fillColor.htmlColor()}`
        const shadowStyle = `stroke:#ccc;stroke-width:${Math.min(this.state.strokeWidth*10, this.state.strokeWidth+10)};fill:none;`

        const controlPoints = []
        for (let i = 0; i < this.state.points.length; i++) {
            const pointKey = this.state.id + `-point-${i}`
            controlPoints.push(
                <Point
                    key={pointKey}
                    x={this.state.points[i][0]}
                    y={this.state.points[i][1]}
                    show={this.state.selected}
                    updatePoint={this.hookToUpdatePoint(this.state.points[i])}
                    getCoordinates={this.props.getCoordinates}
                    updateState={this.updateStateHook}
                    snapping={this.state.snapping}
                    anchor={true}
                />
            )
        }

        const cornerInfo = []
        for (let i = 0; i < this.state.points.length; i++) {
            const point = this.state.points[i]
            const pointBefore = i === 0? this.state.points[this.state.points.length -1]: this.state.points[i-1]
            const pointAfter = i === this.state.points.length - 1? this.state.points[0]: this.state.points[i+1]

            const controlPointBefore = getAnchorPoint(point, pointBefore, this.state.cornerRadius)
            const controlPointAfter = getAnchorPoint(point, pointAfter, this.state.cornerRadius)

            cornerInfo.push(` ${controlPointBefore} Q ${point} ${controlPointAfter} `)
        }
        const roundCornerDef = `M ${cornerInfo.join('L')} Z`


        const points = this.state.points.map(x => x.join(' ')).join(' L ')
        return (
            <g id={this.state.id} ref={el=>this.node=el}>
            <path d={roundCornerDef} style={shadowStyle} visibility={this.state.shadow}/>
            <path d={roundCornerDef} style={style} />
            {controlPoints}
            </g>
        )
    }
}


export class TextNode extends Component {
    constructor(props) {
        super(props)
        this.state = {
            id: props.id,
            x: 1.0 * props.x,
            y: 1.0 * props.y,
            svgX: props.x,
            svgY: props.y,
            textColor: new Color(...props.color),
            text: props.text,
            shadow: 'hidden',
            height: 0,
            width: 0,
            selected:false,
        }
        this.scaleFactor = 1.52
    }
    componentDidMount() {
        this.mounted = true
        let self = document.getElementById(this.state.id)
        if (!self || self.innerHTML === '') return
        let canvas = document.getElementById('grid')
        self.addEventListener('mouseenter', (evt)=>this.handleMouseHover(evt))
        self.addEventListener('mouseleave', (evt)=>this.handleMouseLeave(evt))
        this.props.setTikZ(this.state.id, this.toTikZ())
        const bbox = document.getElementById(this.state.id+'-content').getBoundingClientRect()
        const [offsetX, offsetY] = [0.5*bbox.width*this.props.scale, 0.5*bbox.height*this.props.scale]
        this.setState({
            svgX: this.state.svgX - offsetX,
            svgY: this.state.svgY - offsetY,
            width: bbox.width*this.props.scale,
            height: bbox.height*this.props.scale,
        })
        canvas.addEventListener('pointermove', (evt)=>this.handleMove(evt))
        canvas.addEventListener('pointerdown', (evt)=>this.handlePointerDown(evt))
        canvas.addEventListener('pointerup', (evt)=>this.handleMoveEnd(evt))
    }

    handlePointerDown(evt) {
        evt.preventDefault()
        if (evt.which != 1) return
        if (this.mounted && this.props.tool === 'select'  && this.node && this.node.contains(evt.target)) {
            this.setState({selected: true})
            this.props.setSelectedShape(this.state.id)
            this.props.togglePropsBar(true)
            this.posBuffer = [...this.props.getCoordinates(evt, this.props.snapping)]
            this.pointerDownPos = [... this.props.getCoordinates(evt, this.props.snapping)]
        } else if (this.mounted && this.props.tool === 'select' && this.state.selected ) {
            this.setState({selected:false, shadow:'hidden'})
            if (this.props.getSelectedShape() === this.state.id) {
                this.props.setSelectedShape('')
                this.props.togglePropsBar(false)
            }
        }
    }

    handleMove(evt) {
        evt.preventDefault()
        if (this.mounted && this.posBuffer) {
            const [posX, posY] = this.props.getCoordinates(evt, this.props.snapping)
            const [offsetX, offsetY] = [posX-this.posBuffer[0], posY - this.posBuffer[1]]
            this.posBuffer = [posX, posY]
            this.setState({
                x: this.state.x + offsetX,
                y: this.state.y + offsetY,
                svgX: this.state.svgX + offsetX,
                svgY: this.state.svgY + offsetY,
            })
        }
    }

    handleMoveEnd(evt) {
        evt.preventDefault()
        if (this.mounted && this.pointerDownPos) {
            const [posX, posY] = this.props.getCoordinates(evt, this.props.snapping)
            if (pointsNeq([posX, posY], this.pointerDownPos)) {
                this.props.updateState(this.state.id, {
                    x: this.state.x,
                    y: this.state.y
                })
            }
            this.posBuffer = null
            this.pointerDownPos = null
        }
    }


    handleMouseHover(evt) {
        evt.preventDefault()
        if (this.mounted && this.props.tool === 'select') {
            this.setState({shadow:'visible'})
        }
    }

    handleMouseLeave(evt) {
        evt.preventDefault()
        if (this.mounted && !this.state.selected) {
            this.setState({shadow:'hidden'})
        }
    }

    componentDidUpdate(prevProps) {
        if (!this.mounted) return
        if (prevProps.tool !== this.props.tool) {
            if (this.props.tool === 'select' && this.props.getSelectedShape() === this.state.id) {
                this.setState({
                    selected: true,
                    shadow: "visible",
                })
            } else {
                this.setState({
                    selected: false,
                    shadow: "hidden",
                })
            }
        }
        if (prevProps.x != this.props.x) {
            this.setState((state) => ({
                x: 1.0*this.props.x,
                svgX: this.props.x - 0.5*state.width
            }))
        }
        if (prevProps.text != this.props.text) {
            this.setState({
                text: this.props.text.slice()
            }, ()=>{
                const bbox = document.getElementById(this.state.id+'-content').getBoundingClientRect()
                console.log(bbox.width, bbox.height)
                const [offsetX, offsetY] = [0.5*bbox.width*this.props.scale, 0.5*bbox.height*this.props.scale]
                this.setState((state) => ({
                    svgX: state.svgX + 0.5 * state.width - offsetX,
                    svgY: state.svgY + 0.5 * state.height - offsetY,
                    width: bbox.width*this.props.scale,
                    height: bbox.height*this.props.scale
                }))
            })
        }
        if (prevProps.y != this.props.y) {
            this.setState((state) => ({
                y: 1.0*this.props.y,
                svgY: this.props.y - 0.5*state.height
            }))
        }
        if (prevProps.color != this.props.color) {
            this.setState({textColor: new Color(...this.props.color)})
        }
        if (prevProps.snapping !== this.props.snapping) {
            this.setState({snapping: this.props.snapping})
        }

        this.props.setTikZ(this.state.id, this.toTikZ())
    }

    componentWillUnmount() {
        this.mounted = false
        this.selected = false
        if (this.props.getSelectedShape === this.state.id) {
            this.props.setSelectedShape('')
            this.props.togglePropsBar(false)
        }
    }
    toTikZ() {
        return `\\node at (${this.state.x},${-this.state.y}) [opacity=${this.state.textColor.tikzAlpha()}] {\\textcolor[RGB]{${this.state.textColor.r},${this.state.textColor.g},${this.state.textColor.b}}{${this.state.text}}};\n`
    }
    render() {
        const parts = this.state.text.split('$')
        for (let i = 0; i < parts.length; i+=2) {
            if (parts[i].length > 0) {
                parts[i] = `\\text{${parts[i]}}`
            }
        }
        let rawSVGCode = TexToSVG(parts.join(''))
        if (rawSVGCode.includes('merror')) {
            alert('Cannot parse TeX.')
            this.props.errorHandler(this.state.id)
            return <g id={this.state.id}></g>
        }
        rawSVGCode = rawSVGCode.slice(0, 4) + ` x=${this.state.svgX/this.scaleFactor} y=${this.state.svgY/this.scaleFactor} id=${this.state.id+'-content'} ` + rawSVGCode.slice(4)
        const shadowStyle = `stroke:#ccc;stroke-width:10;fill:#ccc`

        return (
            <g ref={el=>this.node=el} id={this.state.id} color={this.state.textColor.htmlColor()} transform='scale(1.52)'>
                <rect x={this.state.svgX/this.scaleFactor} y={this.state.svgY/this.scaleFactor} height={this.state.height/this.scaleFactor} width={this.state.width/this.scaleFactor} visibility={this.state.shadow} style={shadowStyle}/>
                {parse(rawSVGCode)}
            </g>
        )
    }
}


export class Curve extends Component {
    constructor(props) {
        super(props)
        this.state = {
            snapping: props.snapping,
            tool: props.tool,
            id: props.id,
            anchorPoints: JSON.parse(JSON.stringify(props.anchorPoints)),
            controlPoints: JSON.parse(JSON.stringify(props.controlPoints)),
            strokeStyle: props.strokeStyle,

            strokeColor: new Color(...props.strokeColor),
            fillColor: new Color(...props.fillColor),
            strokeWidth: 2*props.strokeWidth,
            strokeStyle: props.strokeStyle,
            arrow: props.arrow,
            shadow: 'hidden',
            selected: false,
            closed: props.closed
        }
        this.posBuffer = null
        this.hookToUpdatePoint
        this.updateStateHook
    }

    hookToUpdatePoint = (p) => {
        return (x, y) => {
            p[0] += x
            p[1] += y
            this.forceUpdate()
        }
    }

    updateStateHook = () => {
        this.props.updateState(this.state.id, {
            anchorPoints: this.state.anchorPoints,
            controlPoints: this.state.controlPoints
        })
    }

    componentDidMount() {
        this.mounted = true
        let self = document.getElementById(this.state.id)
        let canvas = document.getElementById('grid')
        self.addEventListener('mouseenter', (evt)=>this.handleMouseHover(evt))
        self.addEventListener('mouseleave', (evt)=>this.handleMouseLeave(evt))
        canvas.addEventListener('pointermove', (evt)=>this.handleMove(evt))
        canvas.addEventListener('pointerdown', (evt)=>this.handlePointerDown(evt))
        canvas.addEventListener('pointerup', (evt)=>this.handleMoveEnd(evt))

        this.props.setTikZ(this.state.id, this.toTikZ())

    }

    handlePointerDown(evt) {
        evt.preventDefault()
        if (evt.which !== 1) return
        if (this.mounted && this.props.tool === 'select'  && this.node && this.node.contains(evt.target)) {
            this.setState({selected: true})
            this.props.setSelectedShape(this.state.id)
            this.props.togglePropsBar(true)
            this.posBuffer = [...this.props.getCoordinates(evt, this.props.snapping)]
            this.pointerDownPos = [... this.props.getCoordinates(evt, this.props.snapping)]
        } else if (this.mounted && this.props.tool === 'select' && this.state.selected ) {
            this.setState({selected:false, shadow:'hidden'})
            if (this.props.getSelectedShape() === this.state.id) {
                this.props.setSelectedShape('')
                this.props.togglePropsBar(false)
            }
        }
    }

    handleMove(evt) {
        evt.preventDefault()
        if (this.mounted && this.posBuffer) {
            const [posX, posY] = this.props.getCoordinates(evt, this.props.snapping)
            const [offsetX, offsetY] = [posX-this.posBuffer[0], posY - this.posBuffer[1]]
            this.posBuffer = [posX, posY]
            this.setState({
                anchorPoints: this.state.anchorPoints.map(([x, y])=>[x+offsetX, y+offsetY]),
                controlPoints: this.state.controlPoints.map(([x, y])=>[x+offsetX, y+offsetY])
            })
        }
    }

    handleMoveEnd(evt) {
        evt.preventDefault()
        if (this.pointerDownPos) {
            const [posX, posY] = this.props.getCoordinates(evt, this.props.snapping)
            if (pointsNeq([posX, posY], this.pointerDownPos)) {
                this.props.updateState(this.state.id, {
                    anchorPoints: this.state.anchorPoints,
                    controlPoints: this.state.controlPoints
                })
            }
            this.posBuffer = null
            this.pointerDownPos = null
        }
    }

    handleMouseHover(evt) {
        evt.preventDefault()
        if (this.mounted && this.props.tool === 'select') {
            this.setState({shadow:'visible'})
        }
    }

    handleMouseLeave(evt) {
        evt.preventDefault()
        if (this.mounted && !this.state.selected) {
            this.setState({shadow:'hidden'})
        }
    }

    componentDidUpdate(prevProps) {
        if (!this.mounted) return
        if (prevProps.tool !== this.props.tool) {
            if (this.props.tool === 'select' && this.props.getSelectedShape() === this.state.id) {
                this.setState({
                    selected: true,
                    shadow: "visible",
                })
            } else {
                this.setState({
                    selected: false,
                    shadow: "hidden",
                })
            }
        }
        let needToUpdate = false
        if (prevProps.anchorPoints.length !== this.props.anchorPoints.length) {
            needToUpdate = true
        } else {
            for (let i = 0; i < prevProps.anchorPoints.length; i++) {
                if (pointsNeq(prevProps.anchorPoints[i], this.props.anchorPoints[i])) {
                    needToUpdate = true
                    break
                }
            }
        }
        if (needToUpdate) {
            this.setState({anchorPoints: JSON.parse(JSON.stringify(this.props.anchorPoints))})
        }
        needToUpdate = false
        if (prevProps.controlPoints.length !== this.props.controlPoints.length) {
            needToUpdate = true
        } else {
            for (let i = 0; i < prevProps.controlPoints.length; i++) {
                if (pointsNeq(prevProps.controlPoints[i], this.props.controlPoints[i])) {
                    needToUpdate = true
                    break
                }
            }
        }
        if (needToUpdate) {
            this.setState({controlPoints: JSON.parse(JSON.stringify(this.props.controlPoints))})
        }
        if (prevProps.arrow != this.props.arrow) {
            this.setState({arrow: this.props.arrow})
        }
        if (prevProps.strokeStyle != this.props.strokeStyle) {
            this.setState({strokeStyle: this.props.strokeStyle})
        }
        if (prevProps.strokeWidth != this.props.strokeWidth) {
            this.setState({strokeWidth: 2*this.props.strokeWidth})
        }
        if (colorsNeq(prevProps.strokeColor, this.props.strokeColor)) {
            this.setState({strokeColor: new Color(...this.props.strokeColor)})
        }
        if (colorsNeq(prevProps.fillColor, this.props.fillColor)) {
            this.setState({fillColor: new Color(...this.props.fillColor)})
        }
        if (prevProps.snapping !== this.props.snapping) {
            this.setState({snapping: this.props.snapping})
        }
        this.props.setTikZ(this.state.id, this.toTikZ())

    }

    componentWillUnmount() {
        this.mounted = false
        this.selected = false
        if (this.props.getSelectedShape === this.state.id) {
            this.props.setSelectedShape('')
            this.props.togglePropsBar(false)
        }
    }

    toTikZ() {
        let pointsFormat = `(${this.state.anchorPoints[0][0]},${-this.state.anchorPoints[0][1]}) `
        for (let i=1; i < this.state.anchorPoints.length; i++) {
            pointsFormat += `..controls (${this.state.controlPoints[2*i-2][0]},${-this.state.controlPoints[2*i-2][1]}) and (${this.state.controlPoints[2*i-1][0]},${-this.state.controlPoints[2*i-1][1]}) .. (${this.state.anchorPoints[i][0]},${-this.state.anchorPoints[i][1]}) `
        }
        if (this.state.closed) pointsFormat += '--cycle'
        return `\\draw[draw=${this.state.strokeColor.tikzColor()}, draw opacity=${this.state.strokeColor.tikzAlpha()}, line width=${this.state.strokeWidth/2}, fill=${this.state.fillColor.tikzColor()}, fill opacity=${this.state.fillColor.tikzAlpha()},${!this.state.closed && this.state.arrow}] ${pointsFormat} ;\n`
    }

    render() {
        const style = `stroke:${this.state.strokeColor.htmlColor()};stroke-width:${this.state.strokeWidth};fill:${this.state.fillColor.htmlColor()}`
        const shadowStyle = `stroke:#ccc;stroke-width:${Math.min(this.state.strokeWidth*10, this.state.strokeWidth+10)};fill:none`
        const arrowSize = 15 + 1.5*this.state.strokeWidth
        const arrowDef = `M ${-arrowSize} ${-arrowSize} A ${arrowSize} ${arrowSize} 0 0 0 0 0 A ${arrowSize} ${arrowSize} 0 0 0 ${-arrowSize} ${arrowSize}`
        const viewBox = `${-arrowSize - 0.5*this.state.strokeWidth} ${-arrowSize- 0.5*this.state.strokeWidth} ${arrowSize + 2*this.state.strokeWidth} ${2*arrowSize + 2*this.state.strokeWidth}`
        const markerRef = `url(#${this.state.id + '-arrow'})`
        const strokeStyle = this.state.strokeStyle === 'dashed'? '8 8' : ''

        const anchorPoints = []
        const controlPoints = []

        let pointCount = 0
        let lineCount = 0
        let def = `M ${this.state.anchorPoints[0][0]},${this.state.anchorPoints[0][1]} `
        for (let i = 0; i < this.state.anchorPoints.length; i++) {
            anchorPoints.push(
                <Point
                    key={this.state.id + `-anchor-point-${pointCount++}`}
                    x={this.state.anchorPoints[i][0]}
                    y={this.state.anchorPoints[i][1]}
                    show={this.state.selected}
                    updatePoint={this.hookToUpdatePoint(this.state.anchorPoints[i])}
                    getCoordinates={this.props.getCoordinates}
                    updateState={this.updateStateHook}
                    snapping={this.state.snapping}
                    anchor={true}
                />
            )
        }

        for (let i = 0; i < 2* this.state.anchorPoints.length -2; i++) {
            controlPoints.push(
                <Point
                    key={this.state.id + `-control-point-${pointCount++}`}
                    x={this.state.controlPoints[i][0]}
                    y={this.state.controlPoints[i][1]}
                    show={this.state.selected}
                    updatePoint={this.hookToUpdatePoint(this.state.controlPoints[i])}
                    getCoordinates={this.props.getCoordinates}
                    updateState={this.updateStateHook}
                    snapping={this.state.snapping}
                    anchor={false}
                />
            )
        }
        const lineStyle = "stroke:rgb(0,0,0);stroke-width:0.5;fill:none"
        const anchorLines = []
        for (let i=1; i < this.state.anchorPoints.length; i++) {
            def += `C ${this.state.controlPoints[2*i-2][0]},${this.state.controlPoints[2*i-2][1]} ${this.state.controlPoints[2*i-1][0]},${this.state.controlPoints[2*i-1][1]} ${this.state.anchorPoints[i][0]},${this.state.anchorPoints[i][1]} `
            anchorLines.push(
                <line
                    key={this.state.id+ `-line-${lineCount++}`}
                    style={lineStyle}
                    x1={this.state.anchorPoints[i-1][0]}
                    y1={this.state.anchorPoints[i-1][1]}
                    x2={this.state.controlPoints[2*i-2][0]}
                    y2={this.state.controlPoints[2*i-2][1]}
                    visibility={this.state.selected?'visible':'hidden'}
                />
            )
            anchorLines.push(
                <line
                    key={this.state.id+ `-line-${lineCount++}`}
                    style={lineStyle}
                    x1={this.state.anchorPoints[i][0]}
                    y1={this.state.anchorPoints[i][1]}
                    x2={this.state.controlPoints[2*i-1][0]}
                    y2={this.state.controlPoints[2*i-1][1]}
                    visibility={this.state.selected?'visible':'hidden'}
                />
            )
        }
        if (this.state.closed) {
            def += 'Z'
        }
        return (
            <g ref={el=>this.node=el} id={this.state.id}>
                <defs>
                    <marker id={this.state.id + '-arrow'} viewBox={viewBox} refX="0" refY="0" markerHeight={arrowSize + 2*this.state.strokeWidth} markerWidth={2*arrowSize + 2*this.state.strokeWidth} orient="auto-start-reverse" markerUnits='userSpaceOnUse'>
                        <path d={arrowDef} style={style} strokeLinecap="round" strokeLinejoin="round"/>
                    </marker>
                </defs>
                <path d={def} style={shadowStyle} visibility={this.state.shadow}/>
                <path d={def} style={style} markerEnd={!this.state.closed && this.state.arrow !== '' ? markerRef: ''} markerStart={!this.state.closed && this.state.arrow === '<->'? markerRef: ''} strokeDasharray={strokeStyle}/>
                {anchorLines}
                {anchorPoints}
                {controlPoints}
            </g>
        )
    }
}