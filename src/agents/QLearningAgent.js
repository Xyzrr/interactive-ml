function zero2D(rows, cols) {
  var array = [],
    row = [];
  while (cols--) row.push(0);
  while (rows--) array.push(row.slice());
  return array;
}

function argMax(array) {
  return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
}

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

export default class QLearningAgent {
  constructor(options) {
    options = {
      gamma: 0.95,
      lr: 0.1,
      eps: 0.5,
      epsDecay: 0.99,
      ...options
    };
    this.gamma = options.gamma;
    this.lr = options.lr;
    this.eps = options.eps;
    this.epsDecay = options.epsDecay;
  }

  initToEnvironment(stateSpace, actionSpace) {
    this.qTable = zero2D(stateSpace, actionSpace);
  }

  getAction(state) {
    if (this.qTable == null) {
      console.error("Q learning agent not initialized");
    }

    if (Math.random() < this.eps) {
      return getRndInteger(0, this.qTable[0].length);
    } else {
      return argMax(this.qTable[state]);
    }
  }

  update(state, action, newState, reward, done) {
    this.qTable[state][action] +=
      this.lr *
      (reward +
        (done ? 0 : this.gamma * Math.max(...this.qTable[newState])) -
        this.qTable[state][action]);
  }

  finishEpisode() {
    this.eps *= this.epsDecay;
  }
}
