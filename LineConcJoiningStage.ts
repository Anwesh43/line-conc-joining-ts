const w : number = window.innerWidth, h : number = window.innerHeight
const nodes : number = 5
const lines : number = 3

class LineConcJoiningStage {
    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D
    renderer : Renderer = new Renderer()

    initCanvas() {
        this.canvas.width = w
        this.canvas.height = h
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = '#BDBDBD'
        this.context.fillRect(0, 0, w, h)
        this.renderer.render(this.context)
    }

    handleTap() {
        this.canvas.onmousedown = () => {
            this.renderer.handleTap(() => {
                this.render()
            })
        }
    }

    static init() {
        const stage : LineConcJoiningStage = new LineConcJoiningStage()
        stage.initCanvas()
        stage.render()
        stage.handleTap()
    }
}

class State {
    scale : number = 0
    dir : number = 0
    prevScale : number = 0

    update(cb : Function) {
        const k = Math.floor(this.scale / 0.5)
        const p = k * 0.05 + (1 - k) * (0.05) / lines
        console.log(p)
        this.scale += p * this.dir
        //console.log(this.scale)
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir
            this.dir = 0
            this.prevScale = this.scale
            cb()
        }
    }

    startUpdating(cb : Function) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale
            cb()
        }
    }
}

class Animator {

    animated : boolean = false

    interval : number

    start(cb : Function) {
        if (!this.animated) {
            this.animated = true
            this.interval = setInterval(cb, 50)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false
            clearInterval(this.interval)
        }
    }
}

const divideScale : Function = (scale : number, i : number, n : number) : number => {
    return Math.min(1/n, Math.max(0, scale - (1/n) * i)) * n
}

const drawLCJNode : Function = (context : CanvasRenderingContext2D, i : number, scale : number) => {
    const gap : number = w / (nodes + 1)
    const size : number = gap / 3
    const lineGap : number = size / lines
    const dr : number = size / 2
    const sc1 : number = divideScale(scale, 0, 2)
    const sc2 : number = divideScale(scale, 1, 2)
    const deg : number = (Math.PI) / lines
    context.lineCap = 'round'
    context.lineWidth = Math.min(w, h) / 60
    context.strokeStyle = '#1A237E'
    context.save()
    context.translate(gap * (1 + i), h/2)
    for (var i = 0; i < lines; i++) {
        const sc : number = divideScale(sc1, i, lines)
        context.save()
        context.rotate(2 * deg * i)
        const sr : number = lineGap * (i + 1)
        const r = sr + (dr - sr) * sc2
        const y : number = r * Math.sin(deg)
        const wr : number = 2 * dr * Math.cos(deg)
        context.beginPath()
        context.moveTo(-wr * sc, y)
        context.lineTo(wr * sc, y)
        context.stroke()
        context.restore()
    }
    context.restore()
}

class LCJNode {
    next : LCJNode
    prev : LCJNode
    state : State = new State()
    constructor(private i : number) {
        this.addNeighbor()
    }

    addNeighbor() {
        if (this.i < nodes - 1) {
            this.next = new LCJNode(this.i + 1)
            this.next.prev = this
        }
    }

    draw(context : CanvasRenderingContext2D) {
        drawLCJNode(context, this.i, this.state.scale)
        if (this.prev) {
            this.prev.draw(context)
        }
    }

    update(cb : Function) {
        this.state.update(cb)
    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }

    getNext(dir : number, cb : Function) : LCJNode {
        var curr : LCJNode = this.prev
        if (dir == 1) {
            curr = this.next
        }
        if (curr) {
            return curr
        }
        cb()
        return this
    }
}

class LineConcJoining {
    curr : LCJNode = new LCJNode(0)
    dir : number = 1

    draw(context : CanvasRenderingContext2D) {
        this.curr.draw(context)
    }

    update(cb : Function) {
        this.curr.update(() => {
            this.curr = this.curr.getNext(this.dir, () => {
                this.dir *= -1
            })
            cb()
        })
    }

    startUpdating(cb : Function) {
        this.curr.startUpdating(cb)
    }
}

class Renderer {
    lcj : LineConcJoining = new LineConcJoining()
    animator : Animator = new Animator()

    render(context) {
        this.lcj.draw(context)
    }

    handleTap(cb : Function) {
        this.lcj.startUpdating(() => {
            this.animator.start(() => {
                cb()
                this.lcj.update(() => {
                    this.animator.stop()
                    cb()
                })
            })
        })
    }
}
