import { Scene } from 'phaser';

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

        this.cameras.main.setBackgroundColor('#2a0d0d');

        this.add.text(width * 0.5, height * 0.4, 'Конец игры', {
            fontFamily: 'Arial Black',
            fontSize: 56,
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(width * 0.5, height * 0.5, `Счёт: ${score}`, {
            fontFamily: 'Arial',
            fontSize: 36,
            color: '#ffe08a',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(width * 0.5, height * 0.62, 'Клик, чтобы начать заново', {
            fontFamily: 'Arial',
            fontSize: 28,
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
