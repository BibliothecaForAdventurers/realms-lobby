// graphSystem - Loads a graph, parses it, and traverses it
// Returns an object that can be sent to the client and displayed

import EventEmitter from 'events'
import { GameObjects } from 'phaser'
import { ISystem, Registry } from '../../engine/registry'
import { COLORS } from '../../config'

// Graph data structures
import { Edge } from './edge'

export class GraphSystem implements ISystem {
    private events: Phaser.Events.EventEmitter
    private ecs: Registry
    private scene: Phaser.Scene
    public type = 'graphSystem'

    // Graph data
    public edges: Edge[] = []
    public adjacency: Map<number, number[]> = new Map()
    public reverseAdjacency: Map<number, number[]> = new Map()
    public nodes: Array<number> = []
    
    // Graph state
    public currentNode: number = 0

    // Game Objects
    public container: GameObjects.Container
    public nodeTexts: Array<Phaser.GameObjects.Text> = []
    public currentNodeSelector: GameObjects.Arc

    constructor(events: Phaser.Events.EventEmitter, ecs: Registry, scene: Phaser.Scene) {
        this.events = events
        this.ecs = ecs
        this.scene = scene

         // Stub out initial graph
        const edges = [
            [0, 1, 1],
            [ 1, 2, 1 ],
            [ 2, 3, 1 ],
            [ 3, 4, 1 ],
            [1, 4, 1]
            // [4, 0, 1]    // Finish the graph (loop to exit)
        ]

        // HACK - parse graph data
        this.setupGraph(edges)
       
    }


    update = () => {
        // Update current node selector's position whne we change nodes
        // TODO: Should this be an event?
        if (this.currentNodeSelector.x != this.nodeTexts[this.currentNode].x || this.currentNodeSelector.y != this.nodeTexts[this.currentNode].y) {

            this.currentNodeSelector.x = this.nodeTexts[this.currentNode].x
        }

        if (this.currentNodeSelector.y != this.nodeTexts[this.currentNode].y) {
            this.currentNodeSelector.y = this.nodeTexts[this.currentNode].y
        }

    }

    // Instantiates edges and prepares to traverse them
    setupGraph = (edges): void => {
        for (let i = 0; i < edges.length; i++) {
            // Add edge to graph
            this.edges.push(new Edge(edges[i][0], edges[i][1], edges[i][2]))
        }

        // Create adjacency list that we can traverse
        this.createVertices()

        // Identify nodes via breath first search
        this.breadthFirst()

        // Draw Graph

        // create a container which will adjust the position of all child gameobjects inside it
        this.container = this.scene.add.container(this.scene.cameras.main.centerX, this.scene.cameras.main.centerY)

        this.drawNodes()
        this.drawSelectedNode()
        this.drawVertices()
        
    }

    createVertices = (): void => {
        // Walk through each node of the 'dungeon' and define connections between edges
        // Create an adjacency list (e.g. node 0 -> 1, 2)
        // Example: { 0 => [ 1 ], 1 => [ 2, 4 ], 2 => [ 3 ], 3 => [ 4 ] }
        // This data structure is easier to traverse than just a list of edges

        for (let i = 0; i < this.edges.length; i++) {
            // Assign to local variables so it's easier to read
            const src = this.edges[i].src_identifier
            const dst = this.edges[i].dst_identifier

            // Check if node is already in adjacency list
            if(!this.adjacency.get(src)) {
                this.adjacency.set(src, [])
            }
            // Add destination to adjacency list
            this.adjacency.get(src).push(dst)

            if (!this.reverseAdjacency.get(dst)) {
                this.reverseAdjacency.set(dst, [])
            }
            // Add source to reverse adjacency list
            this.reverseAdjacency.get(dst).push(src)
        }
    }

    drawNodes = (): void => {
        // How far from the edge of the canvas should we draw each node?
        const xOffset = 100
        const yOffset = 100
        
        // How much space should we add between two nodes?
        const xSpacer = 100
        const ySpacer = 100

        // Start walking through each node
        for (let i = 0; i < this.nodes.length; i++) {
            const x = xOffset * (this.getDepth(this.nodes[i]))
            
            // Calculate how many edges each node has - more edges means it gets drawn further down the screen
            let numEdges = this.reverseAdjacency.get(this.nodes[i]) ? this.reverseAdjacency.get(this.nodes[i]).length : 1
            let y = yOffset * (numEdges-1)  // we subtract 1 so our graph is centered vertically
            
            // Keep track of what position our node is in (so we can reference it later via array)
            let index = this.nodes[i].toString()

            // Draw the circular background
            const circle = this.scene.add.circle(x, y, 30, COLORS.primary.hex)
            this.container.add(circle)

            // Draw the node number
            this.nodeTexts[index] = this.scene.add.text(x, y, index, { color: 'white' })
                .setOrigin(0.5)
                .setFontSize(20)
            this.container.add(this.nodeTexts[index])
        }
    }

    drawSelectedNode = (): void => {
        // Draw the a circle around the currently selected node
        this.currentNodeSelector = this.scene.add.circle(0, 0, 36, 0x000000, 0)
            .setStrokeStyle(2, COLORS.primary.hex, 1) // To draw a circle w/o fill, we set fill alpha to 0 and add a stroke
        this.container.add(this.currentNodeSelector)

        // Node selector should pulse to indicate it's selected
        this.scene.tweens.add({
                targets: this.currentNodeSelector,
            alpha: { value: 0.3, duration: 600 },
            ease: 'Sine.easeInOut',
                // delay: 50,
                yoyo: true,
                loop: -1,
            });
    }

     drawVertices = (): void => {
        // Loop through each edge (vertices)
         for (let i = 0; i < this.edges.length; i++) {
            // Get the source and destination nodes for this edge
            const src = this.edges[i].src_identifier
            const dst = this.edges[i].dst_identifier

            // get the text object so we can determine its location
            const srcNode = this.nodeTexts[src]
            const dstNode = this.nodeTexts[dst]

            // Draw our line
            const graphics = this.scene.add.graphics()
            graphics.lineStyle(2, 0xFFFFFF)
            const tmp = graphics.lineBetween(srcNode.x, srcNode.y, dstNode.x, dstNode.y)
            this.container.add(tmp).sendToBack(tmp) // Containers ignore setDepth so instead we send this object to the back of the queue
        }
    }


    // Utility functions
    // Returns the depth of a given node (via BFS)
    getDepth = (node) => {
        const start = 0 // We always start at position zero
        let count = 0   // Keep track of the depth we've traversed

        const visited = new Set()
        const queue = [start]

        while (queue.length > 0) {
            const _node = queue.pop()
            if (_node === node) {
                break;
            }

            const neighbors = this.adjacency.get(_node)
            if (neighbors) {
                for (let i = 0; i < neighbors.length; i++) {
                    if (!visited.has(neighbors[i])) {
                        // We found a new node, add it to the queue
                        count++
                        visited.add(neighbors[i])
                        queue.push(neighbors[i])
                    }   
                }
            } else { 
                // We didn't encounter a subgraph so we should backtrack
                count--
            }
        }
         
        return(count)
    }

    breadthFirst = () => {
        // Use BFS (depth-first) search
        const start = 0 // We always start at position zero

        // Walk through each node of the 'dungeon' and output the path
        const queue = [start]
        const visited = {}
        visited[start] = true

        let currentVertex

        // Iterate until there are no edges left to visit
        while (queue.length) {
            // Grab the first node
            currentVertex = queue.shift()
            this.nodes.push(currentVertex)

            // Make sure node has a next step
            if (this.adjacency.get(currentVertex)) {
                this.adjacency.get(currentVertex).forEach(neighbor => {
                    if (!visited[neighbor]) {
                        visited[neighbor] = true
                        queue.push(neighbor)
                    }
                })
            }
        } 
    }

     depthFirst = () => {
        // Use DFS (depth-first) search so we can add a spacer after we hit a dead end
         const start = 0 // We always start at position zero
         
        // Walk through each node of the 'dungeon' and output the path
        const stack = [start]
        const visited = {}
        visited[start] = true

        let currentVertex

        // Iterate until there are no edges left to visit
        while (stack.length) {
            // Grab the first node
            currentVertex = stack.pop()
            this.nodes.push(currentVertex)

            // Make sure node has a next step
            if (this.adjacency.get(currentVertex)) {
                this.adjacency.get(currentVertex).forEach(neighbor => {
                    if (!visited[neighbor]) {
                        visited[neighbor] = true
                        stack.push(neighbor)
                    }
                })
            }
        } 
    }

    debug = () => {
        console.log(this.edges)
    }
}

