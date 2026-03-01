import { Scene } from 'phaser';
import { getHighScore } from '../systems/Storage';

export class GameOver extends Scene
{
    constructor ()
    {
        super('GameOver');
    }

    create (data)
    {
        const { width, height } = this.scale;
        const score = data?.score ?? 0;
        const highScore = getHighScore();

        this.cameras.main.setBackgroundColor('#2a0d0d');

        this.add.text(width * 0.5, height * 0.35, 'Game Over', {
            fontFamily: 'Arial Black',
            fontSize: 56,
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(width * 0.5, height * 0.47, `Score: ${score}`, {
            fontFamily: 'Arial',
            fontSize: 36,
            color: '#ffe08a',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(width * 0.5, height * 0.55, `High Score: ${highScore}`, {
            fontFamily: 'Arial',
            fontSize: 28,
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        const restartButton = this.add.rectangle(width * 0.5, height * 0.68, 220, 68, 0x4fd1c5)
            .setStrokeStyle(3, 0xffffff)
            .setInteractive({ useHandCursor: true });

        this.add.text(width * 0.5, height * 0.68, 'Restart', {
            fontFamily: 'Arial Black',
            fontSize: 30,
            color: '#102a43'
        }).setOrigin(0.5);

        restartButton.on('pointerdown', () => {
            this.scene.start('RunnerScene');
        });

        this.add.text(width * 0.5, height * 0.77, 'Нажми R для быстрого рестарта', {
            fontFamily: 'Arial',
            fontSize: 24,
            color: '#dddddd',
            align: 'center'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-R', () => {
            this.scene.start('RunnerScene');
        });
    }
}
