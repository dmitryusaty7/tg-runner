import { Scene } from 'phaser';

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

        this.add.text(width * 0.5, height * 0.35, 'Вертикальный раннер', {
            fontFamily: 'Arial Black',
            fontSize: 48,
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(width * 0.5, height * 0.55, 'Клик/тап, чтобы начать', {
            fontFamily: 'Arial',
            fontSize: 32,
            color: '#dddddd',
            align: 'center'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.start('Game');
        });

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('Game');
        });
    }
}
