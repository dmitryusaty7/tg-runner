import {
    CRATER_DEPTH,
    CRATER_W,
    DEPTHS,
    GROUND_Y,
    METEOR,
    METEOR_LANE_HIGH_Y,
    METEOR_LANE_LOW_Y,
    METEOR_LANE_MID_Y,
    ROCK_BIG_H,
    ROCK_BIG_W,
    ROCK_SMALL_H,
    ROCK_SMALL_W
} from '../../config/gameConfig';

export class ObstacleManager
{
    constructor (scene)
    {
        this.scene = scene;
        this.groundGroup = scene.physics.add.group({ allowGravity: false, immovable: true });
        this.airGroup = scene.physics.add.group({ allowGravity: false, immovable: true });
        this.craters = [];

        this.pool = {
            rockSmall: [],
            rockBig: [],
            meteor: [],
            crater: []
        };
    }

    getGroups ()
    {
        return {
            ground: this.groundGroup,
            air: this.airGroup
        };
    }

    spawnRock (type, x)
    {
        const width = type === 'ROCK_SMALL' ? ROCK_SMALL_W : ROCK_BIG_W;
        const height = type === 'ROCK_SMALL' ? ROCK_SMALL_H : ROCK_BIG_H;
        const y = GROUND_Y - height / 2;
        const poolKey = type === 'ROCK_SMALL' ? 'rockSmall' : 'rockBig';
        const textureKey = type === 'ROCK_SMALL' ? 'obstacle.rockSmall' : 'obstacle.rockBig';
        const obstacle = this.obtainFromPool(poolKey, () => {
            const sprite = this.createObstacleSprite(textureKey, `${textureKey}-fallback`, width, height, 0xff7a7a);
            this.scene.physics.add.existing(sprite);
            sprite.body.setAllowGravity(false);
            sprite.body.setImmovable(true);
            return sprite;
        });

        obstacle.setPosition(x, y);
        obstacle.setActive(true).setVisible(true);
        obstacle.setDepth(DEPTHS.OBSTACLE);
        obstacle.body.enable = true;
        obstacle.body.setSize(width, height, true);
        obstacle.setData('type', type);
        obstacle.setData('requiresJump', true);
        this.groundGroup.add(obstacle);
        return obstacle;
    }

    spawnMeteor (lane, x)
    {
        const yMap = {
            HIGH: METEOR_LANE_HIGH_Y,
            MID: METEOR_LANE_MID_Y,
            LOW: METEOR_LANE_LOW_Y
        };
        const y = yMap[lane] ?? METEOR_LANE_MID_Y;
        const obstacle = this.obtainFromPool('meteor', () => {
            const sprite = this.createObstacleSprite('obstacle.meteor', 'obstacle.meteor-fallback', METEOR.W, METEOR.H, 0xffc857);
            this.scene.physics.add.existing(sprite);
            sprite.body.setAllowGravity(false);
            sprite.body.setImmovable(true);
            return sprite;
        });

        obstacle.setPosition(x, y);
        obstacle.setActive(true).setVisible(true);
        obstacle.setDepth(DEPTHS.OBSTACLE);
        obstacle.body.enable = true;
        obstacle.body.setSize(METEOR.W, METEOR.H, true);
        obstacle.setData('type', 'METEOR');
        obstacle.setData('lane', lane);
        this.airGroup.add(obstacle);
        return obstacle;
    }

    spawnCrater (x)
    {
        const y = GROUND_Y;
        const crater = this.obtainFromPool('crater', () => this.createCraterSprite());
        crater.setPosition(x, y);
        crater.setActive(true).setVisible(true);
        crater.setDepth(DEPTHS.CRATER);
        crater.setData('type', 'CRATER');
        crater.setData('requiresJump', true);
        this.craters.push({
            sprite: crater,
            xStart: x - CRATER_W / 2,
            xEnd: x + CRATER_W / 2,
            requiresJump: true
        });
        return crater;
    }

    createCraterSprite ()
    {
        if (this.scene.textures.exists('obstacle.crater') && !this.scene.missingAssetIds?.has('obstacle.crater'))
        {
            return this.scene.add.image(0, 0, 'obstacle.crater').setOrigin(0.5, 1).setDisplaySize(CRATER_W, CRATER_DEPTH);
        }

        if (!this.scene.textures.exists('obstacle.crater-fallback'))
        {
            const texture = this.scene.textures.createCanvas('obstacle.crater-fallback', CRATER_W, CRATER_DEPTH);
            const context = texture.getContext();
            context.fillStyle = '#0b0b0b';
            context.beginPath();
            context.ellipse(CRATER_W / 2, CRATER_DEPTH / 2, CRATER_W / 2, CRATER_DEPTH / 2, 0, 0, Math.PI * 2);
            context.fill();
            context.strokeStyle = '#2a2a2a';
            context.lineWidth = 3;
            context.stroke();
            texture.refresh();
        }

        return this.scene.add.image(0, 0, 'obstacle.crater-fallback').setOrigin(0.5, 1);
    }

    createObstacleSprite (textureKey, fallbackKey, width, height, fallbackColor)
    {
        if (this.scene.textures.exists(textureKey) && !this.scene.missingAssetIds?.has(textureKey))
        {
            return this.scene.add.image(0, 0, textureKey).setDisplaySize(width, height);
        }

        if (!this.scene.textures.exists(fallbackKey))
        {
            const texture = this.scene.textures.createCanvas(fallbackKey, width, height);
            const context = texture.getContext();
            context.fillStyle = `#${fallbackColor.toString(16).padStart(6, '0')}`;
            context.fillRect(0, 0, width, height);
            context.strokeStyle = '#1a1a1a';
            context.lineWidth = 2;
            context.strokeRect(1, 1, width - 2, height - 2);
            texture.refresh();
        }

        return this.scene.add.image(0, 0, fallbackKey).setDisplaySize(width, height);
    }

    update (speed, deltaSeconds)
    {
        this.groundGroup.getChildren().forEach((obstacle) => {
            obstacle.body.setVelocityX(-speed);
            if (obstacle.x < -obstacle.width)
            {
                this.releaseObstacle(obstacle);
            }
        });

        this.airGroup.getChildren().forEach((obstacle) => {
            obstacle.body.setVelocityX(-speed * 0.9);
            if (obstacle.x < -obstacle.width)
            {
                this.releaseObstacle(obstacle);
            }
        });

        this.craters = this.craters.filter((craterData) => {
            craterData.sprite.x -= speed * deltaSeconds;
            craterData.xStart = craterData.sprite.x - CRATER_W / 2;
            craterData.xEnd = craterData.sprite.x + CRATER_W / 2;
            if (craterData.sprite.x < -CRATER_W)
            {
                this.releaseCrater(craterData.sprite);
                return false;
            }
            return true;
        });
    }

    releaseObstacle (obstacle)
    {
        obstacle.body.stop();
        obstacle.body.enable = false;
        obstacle.setActive(false).setVisible(false);
        this.groundGroup.remove(obstacle, false);
        this.airGroup.remove(obstacle, false);

        const type = obstacle.getData('type');
        if (type === 'ROCK_SMALL')
        {
            this.pool.rockSmall.push(obstacle);
        }
        else if (type === 'ROCK_BIG')
        {
            this.pool.rockBig.push(obstacle);
        }
        else
        {
            this.pool.meteor.push(obstacle);
        }
    }

    releaseCrater (crater)
    {
        crater.setActive(false).setVisible(false);
        this.pool.crater.push(crater);
    }

    obtainFromPool (poolKey, createFn)
    {
        const pool = this.pool[poolKey];
        if (pool.length > 0)
        {
            return pool.pop();
        }
        return createFn();
    }
}
