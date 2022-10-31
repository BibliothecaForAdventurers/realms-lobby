/* eslint-disable no-unused-labels */

// Template for a player in the game
// contains the components to load for this object type and the default values that will be loaded unless overridden

{
	components: [
		{ type: 'transform', node: 0 }, // Players always spawn at start of dungeon
		{
			type: 'sprite',
			name: 'warrior',
		},
		{
			type: 'health',
			amount: '10',
		},
		{
			type: 'weapon',
			damage: '5',
			delay: '12',
		},
		{
			type: 'inventory',
			items: [], // Player spawns w/ empty inventory
		},
	]
}
