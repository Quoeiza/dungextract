export default class DungeonGenerator {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = [];
        this.rooms = [];
        this.spawnRooms = [];
    }

    generate() {
        this.grid = new Array(this.height).fill(0).map(() => new Array(this.width).fill(1));
        this.rooms = [];
        this.spawnRooms = [];

        const bspRoot = this.splitContainer({ x: 1, y: 1, w: this.width - 2, h: this.height - 2 }, 6);
        const leaves = this.getLeaves(bspRoot);

        for (const leaf of leaves) {
            const availableW = leaf.w - 2;
            const availableH = leaf.h - 2;

            if (availableW < 3 || availableH < 3) continue;

            const roomW = Math.min(8, Math.max(3, Math.floor(availableW * (0.5 + Math.random() * 0.5))));
            const roomH = Math.min(8, Math.max(3, Math.floor(availableH * (0.5 + Math.random() * 0.5))));
            const roomX = leaf.x + 1 + Math.floor(Math.random() * (availableW - roomW + 1));
            const roomY = leaf.y + 1 + Math.floor(Math.random() * (availableH - roomH + 1));
            
            const room = {
                x: roomX, y: roomY, w: roomW, h: roomH,
                cx: roomX + Math.floor(roomW / 2),
                cy: roomY + Math.floor(roomH / 2),
                isSpawn: false
            };
            
            this.createRoom(room);
            this.rooms.push(room);
            leaf.room = room;
        }

        this.connectBSPNodes(bspRoot);

        if (this.rooms.length > 0) {
            const extraCorridors = Math.floor(this.rooms.length * 1.5);
            for (let i = 0; i < extraCorridors; i++) {
                const r1 = this.rooms[Math.floor(Math.random() * this.rooms.length)];
                const r2 = this.rooms[Math.floor(Math.random() * this.rooms.length)];
                if (r1 !== r2) {
                    this.createCorridor(r1.cx, r1.cy, r2.cx, r2.cy);
                }
            }
        }

        if (this.rooms.length > 0) {
            this.spawnRooms = this.rooms.slice(0, Math.min(2, this.rooms.length)).map(r => { 
                r.isSpawn = true; 
                return r; 
            });
        }
        
        this.addFeature(2, 200, 10, 1);

        for (const room of this.rooms) {
            if (Math.random() > 0.5) {
                const torchX = room.cx;
                const torchY = room.y;
                if (this.grid[torchY-1] && this.grid[torchY-1][torchX] === 1) {
                    this.grid[torchY][torchX] = 0;
                    this.grid[torchY-1][torchX] = 5;
                }
            }
        }
        
        return { grid: this.grid, rooms: this.rooms, spawnRooms: this.spawnRooms };
    }

    splitContainer(container, iter) {
        const root = { ...container, left: null, right: null };
        
        if (iter <= 0 || (container.w < 6 && container.h < 6)) {
            return root;
        }

        let splitH = Math.random() > 0.5;
        if (container.w > container.h && container.w / container.h >= 1.1) splitH = false;
        else if (container.h > container.w && container.h / container.w >= 1.1) splitH = true;

        const minSplit = 3;
        const max = (splitH ? container.h : container.w) - minSplit; 
        if (max <= minSplit) return root;

        const splitAt = Math.floor(Math.random() * (max - minSplit)) + minSplit;

        if (splitH) {
            root.left = this.splitContainer({ x: container.x, y: container.y, w: container.w, h: splitAt }, iter - 1);
            root.right = this.splitContainer({ x: container.x, y: container.y + splitAt, w: container.w, h: container.h - splitAt }, iter - 1);
        } else {
            root.left = this.splitContainer({ x: container.x, y: container.y, w: splitAt, h: container.h }, iter - 1);
            root.right = this.splitContainer({ x: container.x + splitAt, y: container.y, w: container.w - splitAt, h: container.h }, iter - 1);
        }

        return root;
    }

    getLeaves(node, result = []) {
        if (!node.left && !node.right) {
            result.push(node);
            return result;
        }
        if (node.left) this.getLeaves(node.left, result);
        if (node.right) this.getLeaves(node.right, result);
        return result;
    }

    connectBSPNodes(node) {
        if (node.left && node.right) {
            this.connectBSPNodes(node.left);
            this.connectBSPNodes(node.right);

            const leftLeaves = this.getLeaves(node.left);
            const rightLeaves = this.getLeaves(node.right);
            const roomA = leftLeaves[Math.floor(Math.random() * leftLeaves.length)].room;
            const roomB = rightLeaves[Math.floor(Math.random() * rightLeaves.length)].room;

            if (roomA && roomB) {
                this.createCorridor(roomA.cx, roomA.cy, roomB.cx, roomB.cy);
            }
        }
    }

    createRoom(room) {
        for (let y = room.y; y < room.y + room.h; y++) {
            for (let x = room.x; x < room.x + room.w; x++) {
                this.grid[y][x] = 0;
            }
        }
    }

    createCorridor(x1, y1, x2, y2) {
        let x = x1;
        let y = y1;
        
        this.grid[y][x] = 0;

        while (x !== x2 || y !== y2) {
            const dx = x2 - x;
            const dy = y2 - y;
            
            const moveX = Math.abs(dx) > Math.abs(dy) 
                ? Math.random() < 0.7
                : Math.random() < 0.3;

            const forceX = (y === y2);
            const forceY = (x === x2);
            
            const isX = forceX || (moveX && !forceY);
            
            const step = Math.floor(Math.random() * 3) + 1;
            const dir = isX ? Math.sign(dx) : Math.sign(dy);
            
            for (let i = 0; i < step; i++) {
                if (isX) { 
                    if (x === x2) break; 
                    x += dir; 
                    if (y >= 2 && this.grid[y-2][x] === 0) {
                        this.grid[y-1][x] = 0;
                    } else if (y >= 3 && this.grid[y-3][x] === 0) {
                        this.grid[y-1][x] = 0;
                        this.grid[y-2][x] = 0;
                    }
                    if (y <= this.height - 3 && this.grid[y+2][x] === 0) {
                        this.grid[y+1][x] = 0;
                    } else if (y <= this.height - 4 && this.grid[y+3][x] === 0) {
                        this.grid[y+1][x] = 0;
                        this.grid[y+2][x] = 0;
                    }
                } else { 
                    if (y === y2) break; 
                    y += dir; 
                }
                this.grid[y][x] = 0;
            }
        }
    }
    
    addFeature(tileType, count, maxSize, minSize = 2) {
        if (!this.rooms || this.rooms.length === 0) return;

        for (let i = 0; i < count; i++) {
            const room = this.rooms[Math.floor(Math.random() * this.rooms.length)];
            if (room.isSpawn) continue;

            const size = Math.floor(Math.random() * maxSize) + minSize;
            if (room.w <= size + 2 || room.h <= size + 2) continue;

            const startX = room.x + 1 + Math.floor(Math.random() * (room.w - size - 1));
            const startY = room.y + 1 + Math.floor(Math.random() * (room.h - size - 1));

            for (let y = startY; y < startY + size; y++) {
                for (let x = startX; x < startX + size; x++) {
                    if (x < room.x + room.w -1 && y < room.y + room.h -1) {
                        if (Math.random() > 0.35) {
                            this.grid[y][x] = tileType;
                        }
                    }
                }
            }
        }
    }
}
