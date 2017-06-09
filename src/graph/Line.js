import LineBranch from './LineBranch';

class ColorGenerator{

  static COLORS = [
    'red',
    'blue',
    'orange',
    'brown',
    'black',
    'purple',
    'yellow',
  ];

  constructor(){
    this.colorIndex = -1;
  }

  getNextColor(){
    this.colorIndex += 1;
    return ColorGenerator.COLORS[this.colorIndex % ColorGenerator.COLORS.length];
  }

}

const colorGenerator = new ColorGenerator();

let idCounter = 0;

class Line {

  /**
   *
   * @param json {{id: string, name: string, color: string, branches: Array<{stops: [string]}>}}
   */
  constructor(json) {
    this.name = json.name;
    this.id = json.id || json.name;
    this.graphvizId = `line_id_${idCounter++}`;
    this.color = json.color || colorGenerator.getNextColor();

    /**
     *
     * @type {Array<LineBranch>}
     */
    this.branches = json.branches.map(branchJson => new LineBranch(branchJson));
  }
}

export default Line;