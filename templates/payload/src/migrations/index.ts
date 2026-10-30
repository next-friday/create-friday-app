import * as migration_20261030_005055_initial from './20261030_005055_initial';

export const migrations = [
  {
    up: migration_20261030_005055_initial.up,
    down: migration_20261030_005055_initial.down,
    name: '20261030_005055_initial'
  },
];
