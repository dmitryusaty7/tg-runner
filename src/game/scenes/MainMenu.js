import { Scene } from 'phaser';
import { getHighScore } from '../systems/Storage';

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        const { width, height } = this.scale;

        this.cameras.main.setBackgroundColor('#101010');

        this.add.text(width * 0.5, height * 0.3, 'Moon Runner', {
            fontFamily: 'Arial Black',
            fontSize: 48,
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(width * 0.5, height * 0.44, `High Score: ${getHighScore()}`, {
            fontFamily: 'Arial',
            fontSize: 28,
            color: '#ffe08a',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(width * 0.5, height * 0.56, 'Click or Press Space to Start', {
            fontFamily: 'Arial',
            fontSize: 28,
            color: '#dddddd',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(width * 0.5, height * 0.66, 'Space — Jump', {
            fontFamily: 'Arial',
            fontSize: 24,
            color: '#dddddd',
            align: 'center'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.start('RunnerScene');
        });

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('RunnerScene');
        });
    }
}
