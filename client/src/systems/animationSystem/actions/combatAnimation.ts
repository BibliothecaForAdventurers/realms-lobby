// Combat Animation - Player attacks an enemy

import { IAction } from '../../../engine/actionQueue'
import { Registry } from '../../../engine/registry'

import { GameObjects } from 'phaser'

// Components
import { Sprite } from '../../../components/sprite'

export class CombatAnimation implements IAction {
	started = false
	finished = false

	attacker: string // The entity that is attacking
	attackerComponent: Sprite
	defender: string // The entity that is being attacked
	defenderComponent: Sprite

	events: Phaser.Events.EventEmitter

	constructor(
		attacker: string,
		attackerComponent: Sprite,
		defender: string,
		defenderComponent: Sprite,
		events: Phaser.Events.EventEmitter
	) {
		this.attacker = attacker
		this.attackerComponent = attackerComponent
		this.defender = defender
		this.defenderComponent = defenderComponent
		this.events = events

		this.registerAnimation()
	}

	update = () => {
		// Kick off the animation
		// Only play the animation once
		if (!this.started) {
			this.started = true
			this.animate(
				this.attacker,
				this.attackerComponent,
				this.defender,
				this.defenderComponent
			)
		}
	}

	private animate = (
		attacker: string,
		attackerComponent: Sprite,
		defender: string,
		defenderComponent: Sprite
	) => {
		// Dramatic Pause
		// Player attacks an enemy
		this.playerAttack(attackerComponent.sprite)
		this.enemyDamage(defender, defenderComponent.sprite)
		// Enemy dies
		this.enemyDeath(defender, defenderComponent.sprite)
	}

	playerAttack = (sprite: GameObjects.Sprite) => {
		// Dramatic Pause
		this.attackerComponent.sprite.scene.tweens.add({
			targets: this.attackerComponent.sprite,
			alpha: {
				from: 1,
				to: 1,
			},
			delay: 1000,
			onComplete: () => {
				this.attack()
			},
		})
	}

	attack = () => {
		const attackerSprite = this.attackerComponent.sprite
		attackerSprite.play('attack')
		attackerSprite.chain('idle')
	}

	enemyDamage = (enemy: string, sprite: GameObjects.Sprite) => {
		const currentX = sprite.x
		// Enemy recoils from damage
		sprite.scene.tweens.add({
			delay: 2450,
			targets: sprite,
			x: {
				from: sprite.x - 6,
				to: sprite.x + 6,
			},
			ease: 'Power1',
			duration: 50,
			repeat: 2,
			yoyo: true,
			onStart: () => {
				// Display floating text for damage
				this.events.emit('damage', this.defender, 10)
			},
			onComplete: () => {
				sprite.x = currentX
			},
		})

		// Slight camera shake
		const camera = sprite.scene.cameras.main
		sprite.scene.tweens.add({
			delay: 2450,
			targets: camera,
			zoom: 1.03,
			ease: 'Sine.easeInOut',
			duration: 70,
			repeat: 2,
			yoyo: true,
			onStart: () => {
				// Add slight screen shake
				camera.shake(100, 0.005)
			},
		})
	}
	enemyDeath = (enemy: string, sprite: GameObjects.Sprite) => {
		// Enemy dies - A bit like final fantasy 4?
		// Fade enemy out top to bottom
		sprite.scene.tweens.add({
			delay: 3500,
			targets: sprite,
			alphaTopLeft: 0,
			alphaTopRight: 0,
			ease: 'Power1',
			duration: 1000,
			repeat: 0,
			onComplete: () => {},
		})

		sprite.scene.tweens.add({
			delay: 4000,
			targets: sprite,
			alphaBottomLeft: 0,
			alphaBottomRight: 0,
			ease: 'Power1',
			duration: 1000,
			repeat: 0,
			onComplete: () => {
				// Remove the enemy from the map
				sprite.destroy()
				this.finished = true
			},
		})

		// Shake enemy as it does
		sprite.scene.tweens.add({
			delay: 3500,
			targets: sprite,
			x: {
				from: sprite.x - 2,
				to: sprite.x + 2,
			},
			ease: 'Power1',
			duration: 1000,
			repeat: 2,
			yoyo: true,
		})
	}

	// Spritesheet Animations
	registerAnimation = () => {
		const scene = this.attackerComponent.sprite.scene
		// Import asesprite animations (stored in json file)
		// Export instructions: https://newdocs.phaser.io/docs/3.54.0/focus/Phaser.Loader.LoaderPlugin-aseprite
		scene.anims.createFromAseprite('warrior')
	}
}