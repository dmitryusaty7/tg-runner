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
        const obstacle = this.obtainFromPool(poolKey, () => {
            const rect = this.scene.add.rectangle(0, 0, width, height, 0xff7a7a);
            this.scene.physics.add.existing(rect);
            rect.body.setAllowGravity(false);
            rect.body.setImmovable(true);
            return rect;
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
            const rect = this.scene.add.rectangle(0, 0, METEOR.W, METEOR.H, 0xffc857);
            this.scene.physics.add.existing(rect);
            rect.body.setAllowGravity(false);
            rect.body.setImmovable(true);
            return rect;
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
        const crater = this.obtainFromPool('crater', () => this.createCraterFallback());
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

    createCraterFallback ()
    {
        if (this.scene.textures.exists('obstacle-crater'))
        {
            return this.scene.add.image(0, 0, 'obstacle-crater').setOrigin(0.5, 1);
        }

        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0x0b0b0b, 1);
        graphics.fillEllipse(0, -CRATER_DEPTH / 2, CRATER_W, CRATER_DEPTH);
        graphics.lineStyle(3, 0x2a2a2a, 1);
        graphics.strokeEllipse(0, -CRATER_DEPTH / 2, CRATER_W * 0.98, CRATER_DEPTH * 0.95);
        return graphics;
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
