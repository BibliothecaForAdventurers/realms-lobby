// moveButton.ts - Contains ui logic for the menu to move the character around the world
//
// Events:
// 'move' - sent when a player clicks to move their character

import { GameObjects } from 'phaser'
import { GRID_SIZE } from '../../config'
import { Button } from '../button'

export class MoveButton extends Button {
    private worldEvents: Phaser.Events.EventEmitter
    private player: string

    // Setup components

    // Debug cursor
    private debugCursor: GameObjects.Text

    constructor(scene, state, size, data, callback) {
        // TODO - Make button offsets a factor of number of buttons
        const xOffset = -6 * GRID_SIZE

        super(scene, state, xOffset, 0, size, size, '✥', null, callback)

        if (data.events) {
            this.worldEvents = data.events
        }

        // Handle player creation
        this.worldEvents.on('setupPlayer', (entity: string) => {
            this.player = entity
        })
    }

    public moveUpdate = () => {}

    public enter = () => {
        this.toggleSelected()

        // Change cursor to grabbing (like we're picking up the character)
        this.scene.input.setDefaultCursor('grabbing')

        this.worldEvents.emit('startmoving', this.player)

        // Create debug cursor off-screen (it will snap to cursor on update)
        // this.debugCursor = this.scene.add.text(-50, -50, '')
    }

    public exit = () => {
        this.toggleSelected()

        this.worldEvents.emit('stopmoving', this.player)

        // destroy debug cursor
        // this.debugCursor.destroy()
    }
}
