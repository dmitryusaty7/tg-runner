import { Scene } from 'phaser';
import { getBestScore, resetBestScore } from '../../services/highScore';

export class MainMenuScene extends Scene
{
    constructor ()
    {
        super('MainMenuScene');
        this.bestScoreText = null;
    }

    create ()
    {
        const { width, height } = this.scale;

        this.cameras.main.setBackgroundColor('#0f0f0f');

        this.add.text(width * 0.5, height * 0.22, 'Лунный раннер', {
            fontFamily: 'Arial Black',
            fontSize: 56,
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.bestScoreText = this.add.text(width * 0.5, height * 0.36, `Лучший: ${getBestScore()}`, {
            fontFamily: 'Arial',
            fontSize: 32,
            color: '#ffe08a',
            align: 'center'
        }).setOrigin(0.5);

        const startButton = this.add.text(width * 0.5, height * 0.5, 'Старт', {
            fontFamily: 'Arial Black',
            fontSize: 40,
            color: '#4fd1c5',
            align: 'center'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.add.text(width * 0.5, height * 0.62, 'Пробел / клик — прыжок', {
            fontFamily: 'Arial',
            fontSize: 26,
            color: '#dddddd',
            align: 'center'
        }).setOrigin(0.5);

        const resetButton = this.add.text(width * 0.5, height * 0.72, 'Сбросить лучший', {
            fontFamily: 'Arial',
            fontSize: 24,
            color: '#ff9d9d',
            align: 'center'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        startButton.on('pointerdown', () => this.scene.start('RunnerScene'));
        this.input.keyboard.once('keydown-SPACE', () => this.scene.start('RunnerScene'));

        resetButton.on('pointerdown', () => {
            resetBestScore();
            this.bestScoreText.setText('Лучший: 0');
        });
    }
}
