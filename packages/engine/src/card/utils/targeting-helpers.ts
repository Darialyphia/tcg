import type { Game } from '../../game/game';
import type { CreatureSlot } from '../../game/systems/game-board.system';
import type { SelectedTarget } from '../../game/systems/interaction.system';
import type { Player } from '../../player/player.entity';

export const selectCreatureSlots = (
  game: Game,
  {
    count,
    isElligible,
    onComplete
  }: {
    count: number;
    isElligible: (options: {
      slot: CreatureSlot;
      zone: 'attack' | 'defense';
      playerId: string;
    }) => boolean;
    onComplete: (targets: Array<SelectedTarget & { type: 'creatureSlot' }>) => void;
  }
) => {
  return game.interaction.startSelectingTargets<'creatureSlot'>({
    getNextTarget(targets) {
      if (targets.length >= count) {
        return null;
      }

      return {
        type: 'creatureSlot',
        isElligible
      };
    },
    canCommit(targets) {
      return targets.length === count;
    },
    onComplete
  });
};

export const selectAlliedCreatureSlots = (
  game: Game,
  player: Player,
  count: number,
  onComplete: (targets: Array<SelectedTarget & { type: 'creatureSlot' }>) => void
) => {
  return selectCreatureSlots(game, {
    count,
    isElligible: ({ zone, slot, playerId }) => {
      return player.boardSide.isOccupied(zone, slot) && playerId === player.id;
    },
    onComplete
  });
};
