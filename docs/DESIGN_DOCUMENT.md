# DUEL OF CARTOVERSE

Note: all numbers provided in this design document are subject to change and are here just as an exemple.
Inspiration: Might and Magic Duel of Champions, Carte Online, Yugi-oh.

## Overview

The game is a trading card game that opposes two players.

Each player starts the game with a deck of cards and a hero.

The goal of the game is to bring the enemy's hero HP to 0.

On their turn, players draw and play cards, and can attack with the creature they summon.

## Players

Players start with 6 cards in their hand. They can, at the beginning of the game, choose to replace up to 3 of those cards. This is called the mulligan phase.

The players alternate taking their turn. The first player to play is determined randomly at the start of the game.

To balance first player advantage, the player who plays second gets to draw an additional card. Additionaly, they get an additional special card that costs 0 mana and allows a player to gain an additional mana for one turn only. In addition, the player going first cannot attack on their first turn.

During their turn, the player can

- play shard, creature, or spell cards

- attack with their creatures

## Card Draw

At the beginning of their turn, players draw one card. If they are unable to do so, they lose 1hp.

## Mana

Mana is the resource used to play cards. Players refill all of their available mana at the start of their turn.
They can gain mana once per turn in two different ways:
- playing a Shard card in their Shard zone: when doing this, the player will immediately draw a card, and gain one mana on their next turn.
- playing any card directly in their mana zone, in which case they get the mana immediately.

The measures taken to counterbalance issues with mana screw, are the immediate draw when playing a shard, coupled with the ability to draw an additional card every turn for 1 mana, or to replace a card in your hand. In addition, playing a card directly in the mana zone also offer the possibility of immediately gaining the mana, reducing the negative feelings associated with sacrificing a card.

## Board

A player's side of the board is comprised of the following parts;
- Hero zone: this is where the players's Hero card is placed.
- Hero enchants zone: this is where the Spell cards of the Hero enchant type are placed
- Deck zone: this is where the player's deck is placed
- Graveyard: this is where cards are placed when they are destroyed
- Shard zone: this is where Shards cards are played
- Mana zone: this is where cards used are mana, and shards converted to mana are placed.
- Trap zone: this is where Trap cards are played
- Attack zone: contains five slots where player can play Creature cards, as well as one slot to play one or multiple Sêmm cards of the Row Enchant type
- Defense zone: contains five slots where player can play Creature cards, as well as one slot to play one or multiple Sêmm cards of the Row Enchant type

Additionally, there are five slots betwen the 2 player side of the board to place Spells cards of the Column Enchant type.

### Range clarification 

For Area of Effect (AOE) purposes, the attack zones of both players are considered adjacent to each other. This mean that, if a cards states "deal 3 damage to target creature and all adjacent creatures" and was played on a creature on the attack zone, it could poteentially cause some friendly fire if there was a creature in the other attack zone in the same slot.

Additionaly, the term "adjacent" does not include diagonals.
## Cards

All cards share the following stats:
- Mana cost: how much mana is needed to play the card
- Faction: which faction this cards belongs to
- Rarity: how rare the card is. There are four rarities: Common, Rare, Epic and Legendary. This has no impact on the game.
- Card type: Shard, Spell, Creature or Trap

There are four types of cards:

### Shard Cards

Shards can be played in the shard zone to draw a card and grant +1 max mana at the start of the player's next turn. 

There is a basic shards for each of the game's factions, but this is just for flavor concerns: they all work identically. There may be special shards with additional effects though.

### Creature Cards

Creature cards are played either the Attack or Defense zone.

Units have the following attributes:

- Attack (ATK): the amount of damage this unit inflicts when it attacks.

- Health Points (HP): the amount of damage a unit can take before being destroyed

- Job: used for certain effects (for example: increase the attack of all Mages)

Creatures are either played in the Attack zone of Defense zone. Once summoned, they cannot change zone by themselves except via other card effects. They also cannot move inside their zone (move from one slot to another). The initial positioning of unit is thus a very important decision, as it could matter in some AOE effects.

Creatures can either attack (if they are in the Attack zone), block an enemy attack to another creature or hero (if they are in the Defense zone) or use an ability by becoming exhausted. Once exhausted, they cannot act and are activated again at the start of their owner's turn.

Creatures in the attack zone are not forced to attack: they can choose not to.

In the same fashion, creatures in the defense one are not forced to block.

Creatures come into play exhausted until indicated otherwise on the card text.

Creature can have activated abilities that can be used in response to one of the following action:
- The enemy player declaring an attack
- The enemy player using a spell
- The enemy player using a creature or hero activated ability
- the enemy player ending their turn
They can also freeky be used during their owner's turn.

### Spell Cards

There are different typed of spell cards:

- Cast: A Cast spell can only be played from hand during its owner's turn, and cannot be played in response to another card.
- Burst: A Burst spell can be played during any player's turn provided you have enough mana, and can be played in response to the following action
  - The enemy player declaring an attack
  - The enemy player using a spell
  - The enemy player using a creature or hero activated ability
  - the enemy player ending their turn
- Row Enchant: A Row Enchant spell is played on the attack or defense zone of any player and affects all creatures on this zone, and only this specific zone.
- Column Enchant: a Column Enchant is played on any of the five columns where you play units, and affects all units placed on this spot ofr any player's defense and attack zone
- Creature Enchant: a Creature Enchant spell is played on a creature and only affects this creature.
- Hero Enchant: a Hero Enchant spell is played in the Hero Enchant zone and is an ongoing spell that can affect anything, or grant the hero buffs or debuffs.
- Trap: Trap cards are played in the trap zone, and are trigger when specific actions occur. Note that a player cannot respond to a trap being triggered. Also, if it is triggered as a result of an effect occuring during a chain of effects or burst spell resolving, the trap will acviatr after the whole chain has been resolved.

## Hero

Each player has one hero. The goal of the game is to reduce the enemy's HP to zero. Like cards, heroes also have a faction, and have one or multiple abilities they can activate. These abilities could have varied costs like mana, discarding a card, some cooldown, etc. However, even if an ability has no cost, it can only be used once per turn.

Once per turn, a hero can do one of those actions
- pay 1 mana to draw an additional card
- replace a card in their hand.
- use one of their ability

Their abilities function like a creature ability or burst spell: they can be activated in response to the same actions you can respond a creature ability or burst spell to?

## Loyalty system

A player can add a card of any faction in their deck. However, when playing a card, their hero lose 1hp. They can lose more that that, depending on the card's Loyalty cost, which increase the HP cost of playing the card outside of its faction. For example, a Loyalty 1 card will cost 2hp.

Players cannot pay HP they do not have for loyalty, nor kill themselves while doing so. If they have only 1 hp remaining, they are technically unable to play-out-of faction cards.

## Effect chains

If multiple burst spell or abilities are played in response to each other, they are resolve in a LIFO (last in, first out) fashion. Here is an exemple
- player 1 plays a Cast spell A
- player 2 responds with a Burst Spell B
- player 1 responds with a Creature Ability C
- player 2 passes
- player 1 responds with Burst Spell D
- player 2 passes
- player 1 passes
- the chain resolves in this order: D -> C -> B -> A
Note that a player cannot respond to one of their own action. This means for exemple, if the current player declares an attack, and the opponent doesn't response, the current player does not have the opportunity to play another card before the attack resolves.

## Resolution order

In the event that multiple effeets trigger at the same time (for example, multiple units having "on death" effect), the effects are resolved in the order in which the cards were played.