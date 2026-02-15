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

        this.add.text(width * 0.5, height * 0.38, 'Game Over', {
            fontFamily: 'Arial Black',
            fontSize: 56,
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(width * 0.5, height * 0.5, `Score: ${score}`, {
            fontFamily: 'Arial',
            fontSize: 36,
            color: '#ffe08a',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(width * 0.5, height * 0.58, `High Score: ${highScore}`, {
            fontFamily: 'Arial',
            fontSize: 28,
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(width * 0.5, height * 0.7, 'Press R to Restart', {
            fontFamily: 'Arial',
            fontSize: 28,
            color: '#dddddd',
            align: 'center'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-R', () => {
            this.scene.start('MainMenu');
        });
    }
}
