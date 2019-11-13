import React from "react";
import styled from "styled-components";
import classNames from "classnames";
import SnakeEnv from "../envs/SnakeEnv";
import * as tf from "@tensorflow/tfjs";

const SnakeRendererDiv = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  .row {
    display: flex;
  }
  .cell {
    width: 60px;
    height: 60px;
    &.food {
      background: red;
    }
    &.snake {
      background: green;
    }
    &.tail {
      background: lime;
    }
  }
`;

const env = new SnakeEnv();
const obs = env.getObservation();

const SnakeRenderer: React.FC = props => {
  const WORLD_SIZE = 8;
  let foodPosition = [0, 1];
  let snake = [
    [0, 2],
    [0, 3],
    [1, 3],
    [2, 3]
  ];
  const [observation, setObservation] = React.useState(obs);

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function runModel(model: tf.LayersModel) {
    while (true) {
      let done = false;
      let obs = env.reset();
      while (!done) {
        const prediction = model.predict(
          obs.reshape([1, 9, 9, 3])
        ) as tf.Tensor;
        const action = (prediction.argMax(1).arraySync() as number[])[0];
        const { newObservation, reward, done: newDone } = env.step(action);
        done = newDone;
        obs = newObservation;
        setObservation(newObservation);
        await sleep(300);
      }
    }
  }

  React.useEffect(() => {
    tf.loadLayersModel("/models/snake/model.json").then(model => {
      runModel(model);
    });
  }, []);

  React.useEffect(() => {}, []);

  const obsArray = observation.arraySync() as number[][][];

  return (
    <SnakeRendererDiv>
      {obsArray.map((row, i) => (
        <div className="row" key={i}>
          {row.map((cell, i) => (
            <div
              key={i}
              className={classNames("cell", {
                food: cell[0] === 1,
                snake: cell[1] === 1,
                tail: cell[2] > 0
              })}
            ></div>
          ))}
        </div>
      ))}
    </SnakeRendererDiv>
  );
};

export default SnakeRenderer;
