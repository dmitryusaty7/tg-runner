import Phaser from 'phaser';

export default class RunnerScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RunnerScene' });
  }

  preload() {
    // ничего не грузим на этом этапе
  }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x111111).setOrigin(0, 0);
    this.add.text(20, 20, 'RunnerScene OK', { fontFamily: 'Arial', fontSize: '24px', color: '#ffffff' });
  }

  update() {}
}
