// Wavefunction collapse
//  0 is up, 1 is right, 2 is down, 3 is left

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - 1) + min)
}
Array.prototype.rand = function () {
    console.log(this)
    choice = randomInt(0, this.length);
    return this[choice];
}

class Pos {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    get_neighbours() {
        return [
            new Pos(this.x, this.y + 1),
            new Pos(this.x + 1, this.y),
            new Pos(this.x, this.y - 1),
            new Pos(this.x - 1, this.y)
        ]
    }
}

class Rule {
    constructor(dissallowedTiles) {
        this.dissallowed_tiles = dissallowedTiles;
    }
    check(id) {
        return !(this.dissallowed_tiles.indexOf(id) >= 0)
    }
}

class RuleSet {
    //  0 is up, 1 is right, 2 is down, 3 is left
    constructor(id, rules) {
        this.rules = rules;
        this.tile_id = id
    }
    check(tiles) {
        this.rules.forEach((rule, index) => {
            if (!rule.check(tiles[index])) return false
            return true
        })
    }
}

class Tile {
    constructor(ruleSet, id, char) {
        this.ruleSet = ruleSet;
        this.id = id;
        this.char = char;
    }
    clone() {
        return new Tile(this.ruleSet, this.id, this.char)
    }
}

class EmptyTile extends Tile {
    constructor() {
        super(null, 0, ".")
    }
}

class Grid {
    constructor(size, possibleTiles) {
        this.size = size;
        this.possible_tiles = possibleTiles;
        this.grid = new Array(size).fill(new Array(size).fill(new EmptyTile()));
        this.propagate_stack = [];
    }
    generate() {
        const starting_pos = new Pos(randomInt(0, this.size - 1), randomInt(0, this.size - 1));
        this.propagate_stack = [
            starting_pos.get_neighbours(),
            ...this.propagate_stack,
        ];
        while (true) {
            this.visited = [];
            this.render();
            while (this.propagate_stack > 0) {
                prop_pos = this.propagate_stack.pop();
                this.propagate(prop_pos);
            }

            let min_possible = 999;
            let min_pos_list = [];
            this.grid.forEach((row, index) => {
                for (let i = 0; i < row.length; i++) {
                    let pos = new Pos(i, index);
                    let possibilities = this.get_possible_tiles(pos);
                    if (possibilities == 0) continue;
                    if (possibilities == min_possible) {
                        min_pos_list.push(pos);
                        continue
                    }
                    if (possibilities < min_possible) {
                        min_pos_list = possibilities;
                        min_pos_list = [pos];
                    }
                }
            })

            if (!min_pos_list.length) break;
            const next_pos = min_pos_list.rand();
            this.grid[next_pos.y][next_pos.x] = this.get_possible_tiles(next_pos).rand().clone();
            this.propagate_stack = [
                next_pos.get_neighbours(),
                ...this.propagate_stack,
            ];

            console.log("Done Generating");
        }
    }
    propagate(prop_pos) {
        this.visited.push(prop_pos);
        const out_of_bounds = prop_pos.x < 0 || prop_pos.y < 0 || prop_pos.x > this.size - 1 || prop_pos.y > this.size - 1
        if (out_of_bounds) return;

        if (this.grid[prop_pos.y, prop_pos.x].id != 0) return; // Tile already collapsed

        const possible_tiles = this.get_possible_tiles(prop_pos);

        if (!possible_tiles.length) throw Error("Invalid Rules Set - Impossible Tile Reached")
        if (possible_tiles.length == 1) this.grid[prop_pos.y][prop_pos.x] == possible_tiles[0].clone();

        const neighbours_pos = prop_pos.get_neighbours();
        for (let neighbour in neighbours_pos) {
            if (neighbour.x < 0 || neighbour.y < 0 || neighbour.x > this.size - 1 || neighbour.y > this.size - 1) continue
            if (this.grid[neighbour.y][neighbour.x].id != 0) continue
            if (this.visited.indexOf(neighbour) >= 0) continue
            this.propagate_stack.push(neighbour);
        }
    }
    get_possible_tiles(pos) {
        if (this.grid[pos.y][pos.x].id != 0) return []; // Tile already collapsed

        let neighbours = [];
        pos.get_neighbours().forEach((neighbour, index) => {
            const out_of_bounds = neighbour.x < 0 || neighbour.y < 0 || neighbour.x > this.size - 1 || neighbour.y > this.size - 1
            if (out_of_bounds) neighbours.push(0);
            else neighbours.push(this.grid[neighbour.y][neighbour.x].id);
        })

        let possible_tiles = [];
        this.possible_tiles.forEach((tile) => {
            if (tile.ruleSet.check(neighbours)) possible_tiles.push(tile);
        })
        return possible_tiles;
    }
    render() {
        let output = "\x1b[H\x1b[0J"
        this.grid.forEach((row) => {
            let mappedRow = row.map((tile) => tile.char);
            output += mappedRow.join('');
            output += "\n";
        })
        console.log(output);
    }
}

function main() {
    tile_1 = new Tile(new RuleSet(1, [new Rule([4, 5]), new Rule([4, 5]), new Rule([4, 5]), new Rule([4, 5])]), 1, "\x1b[1;34m~\x1b[22m");
    tile_2 = new Tile(new RuleSet(2, [new Rule([1, 2, 4, 5]), new Rule([1, 2, 4, 5]), new Rule([1, 2, 4, 5]), new Rule([1, 2, 4, 5])]), 2, "\x1b[33m=");
    tile_3 = new Tile(new RuleSet(3, [new Rule([2]), new Rule([2]), new Rule([2]), new Rule([2])]), 3, "\x1b[1;32m#\x1b[22m");
    tile_4 = new Tile(new RuleSet(4, [new Rule([1, 2]), new Rule([1, 2]), new Rule([1, 2]), new Rule([1, 2])]), 4, "\x1b[32m|");
    tile_5 = new Tile(new RuleSet(5, [new Rule([1, 2, 3, 5]), new Rule([1, 2, 3, 5]), new Rule([1, 2, 3, 5]), new Rule([1, 2, 3, 5])]), 5, "\x1b[37m^");

    let grid = new Grid(20, [tile_1, tile_2, tile_3, tile_4, tile_5])
    grid.generate()
}

main()