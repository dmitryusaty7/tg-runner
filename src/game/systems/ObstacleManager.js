import {
    CRATER_DEPTH,
    CRATER_W,
    DEPTHS,
    RUN_LINE_Y,
    METEOR,
    DEBUG,
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
    constructor (scene, { assetLoader, obstacleConfig })
    {
        this.scene = scene;
        this.assetLoader = assetLoader;
        this.obstacleConfig = obstacleConfig;

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


    logSpawn (typeKey, x, y, width, height, obj)
    {
        if (!DEBUG)
        {
            return;
        }

        console.log('[spawn]', typeKey, 'x=', x, 'y=', y, 'w=', width, 'h=', height, 'visible=', obj.visible, 'alpha=', obj.alpha);
    }

    getGroups ()
    {
        return {
            ground: this.groundGroup,
            air: this.airGroup
        };
    }

    getConfigSize (configKey, fallbackWidth, fallbackHeight)
    {
        const fallbackSizeByType = {
            meteor: { width: 100, height: 40 },
            crater: { width: 120, height: 40 },
            rock_small: { width: 59, height: 48 },
            rock_big: { width: 75, height: 85 }
        };

        const config = this.obstacleConfig?.[configKey];
        const asset = this.assetLoader?.get(configKey);

        if (asset && !asset.isPlaceholder)
        {
            return { width: asset.width, height: asset.height };
        }

        return {
            width: config?.baseSize?.width ?? fallbackSizeByType[configKey]?.width ?? fallbackWidth,
            height: config?.baseSize?.height ?? fallbackSizeByType[configKey]?.height ?? fallbackHeight
        };
    }

    spawnRock (type, x)
    {
        const configKey = type === 'ROCK_BIG' ? 'rock_big' : 'rock_small';
        const poolKey = type === 'ROCK_BIG' ? 'rockBig' : 'rockSmall';
        const fallbackWidth = type === 'ROCK_BIG' ? ROCK_BIG_W : ROCK_SMALL_W;
        const fallbackHeight = type === 'ROCK_BIG' ? ROCK_BIG_H : ROCK_SMALL_H;
        const { width, height } = this.getConfigSize(configKey, fallbackWidth, fallbackHeight);
        const y = RUN_LINE_Y - height / 2;
        const textureKey = this.ensureObstacleTexture(configKey, width, height);

        const obstacle = this.obtainFromPool(poolKey, () => {
            const sprite = this.scene.physics.add.image(0, 0, textureKey);
            sprite.body.setAllowGravity(false);
            sprite.body.setImmovable(true);
            return sprite;
        });

        obstacle.setTexture(textureKey);
        obstacle.setDisplaySize(width, height);
        obstacle.setPosition(x, y);
        obstacle.setActive(true).setVisible(true);
        obstacle.setDepth(DEPTHS.OBSTACLE);
        obstacle.body.enable = true;
        obstacle.body.setSize(width, height, true);
        obstacle.setData('type', type);
        obstacle.setData('requiresJump', true);
        this.groundGroup.add(obstacle);
        this.logSpawn(configKey, x, y, width, height, obstacle);
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
        const { width, height } = this.getConfigSize('meteor', METEOR.W, METEOR.H);
        const textureKey = this.ensureObstacleTexture('meteor', width, height);

        const obstacle = this.obtainFromPool('meteor', () => {
            const sprite = this.scene.physics.add.image(0, 0, textureKey);
            sprite.body.setAllowGravity(false);
            sprite.body.setImmovable(true);
            return sprite;
        });

        obstacle.setTexture(textureKey);
        obstacle.setDisplaySize(width, height);
        obstacle.setPosition(x, y);
        obstacle.setActive(true).setVisible(true);
        obstacle.setDepth(DEPTHS.OBSTACLE);
        obstacle.body.enable = true;
        obstacle.body.setSize(width, height, true);
        obstacle.setData('type', 'METEOR');
        obstacle.setData('lane', lane);
        this.airGroup.add(obstacle);
        this.logSpawn('meteor', x, y, width, height, obstacle);
        return obstacle;
    }

    spawnCrater (x)
    {
        const { width, height } = this.getConfigSize('crater', CRATER_W, CRATER_DEPTH);
        const craterTopOffset = Math.min(14, Math.round(height * 0.4));
        const y = RUN_LINE_Y + craterTopOffset;
        const textureKey = this.ensureObstacleTexture('crater', width, height);

        const crater = this.obtainFromPool('crater', () => this.scene.add.image(0, 0, textureKey).setOrigin(0.5, 0));
        crater.setTexture(textureKey);
        crater.setOrigin(0.5, 0);
        crater.setDisplaySize(width, height);
        crater.setPosition(x, y);
        crater.setActive(true).setVisible(true);
        crater.setDepth(DEPTHS.CRATER);
        crater.setData('type', 'CRATER');
        crater.setData('requiresJump', true);
        this.craters.push({
            sprite: crater,
            xStart: x - width / 2,
            xEnd: x + width / 2,
            requiresJump: true
        });
        this.logSpawn('crater', x, y, width, height, crater);
        return crater;
    }

    ensureObstacleTexture (assetKey, width, height)
    {
        const textureKey = `asset:${assetKey}`;
        const asset = this.assetLoader?.get(assetKey);
        if (asset?.img)
        {
            if (this.scene.textures.exists(textureKey))
            {
                this.scene.textures.remove(textureKey);
            }
            this.scene.textures.addImage(textureKey, asset.img);
            return textureKey;
        }

        if (this.scene.textures.exists(textureKey))
        {
            return textureKey;
        }

        const texture = this.scene.textures.createCanvas(textureKey, width, height);
        const context = texture.getContext();
        context.fillStyle = '#e74c3c';
        context.fillRect(0, 0, width, height);
        texture.refresh();
        return textureKey;
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
            craterData.xStart = craterData.sprite.x - craterData.sprite.displayWidth / 2;
            craterData.xEnd = craterData.sprite.x + craterData.sprite.displayWidth / 2;
            if (craterData.sprite.x < -craterData.sprite.displayWidth)
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
