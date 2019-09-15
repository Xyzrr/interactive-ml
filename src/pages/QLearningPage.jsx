import React from "react";
import styled from "styled-components";
import "react-dat-gui/build/react-dat-gui.css";
import * as colors from "../colors";
import useWindowSize from "../util/useWindowSize";
import NChainEnv from "../envs/NChain";
import QLearningAgent from "../agents/QLearningAgent";
import Game from "../Game";
import Table from "../scene-objects/Table";
import ChainEnvironment from "../scene-objects/ChainEnvironment";
import AgentObject from "../scene-objects/AgentObject";
import Scene from "../Scene";
import NumberObject from "../scene-objects/Number";
import ButtonObject from "../scene-objects/ButtonObject";
import DatGui, { DatNumber, DatButton, DatBoolean } from "react-dat-gui";
import BellmanUpdateKatex from "../components/BellmanUpdateKatex";

const initialAgentOptions = {
  gamma: 0.95,
  lr: 0.1,
  eps: 0.5,
  epsDecay: 0.99
};

const env = new NChainEnv();
const agent = new QLearningAgent(initialAgentOptions);
agent.prepareForEnv(env);
const game = new Game(env, agent);

const tableObject = new Table({ x: 50, y: 150 }, agent.qTable);
const rewardNumberObject = new NumberObject({ x: 430, y: 320 }, 0, {
  textAlign: "left",
  font: "40px Inconsolata",
  precision: 0
});
const bestRewardNumberObject = new NumberObject({ x: 430, y: 350 }, 0, {
  textAlign: "left",
  font: "20px Inconsolata",
  precision: 0,
  modifier: v => "Best: " + v
});
const environmentObject = new ChainEnvironment({ x: 320, y: 185 });
const agentObject = new AgentObject({ x: 320, y: 500 });
const upActionObject = new ButtonObject({ x: 100, y: 100 }, "UP");
const downActionObject = new ButtonObject({ x: 200, y: 100 }, "DOWN");

const Page = styled.div`
  background-color: ${colors.darkGray};
`;

function QLearningPage() {
  const canvasRef = React.useRef(null);
  const size = useWindowSize();
  const sceneRef = React.useRef();

  const [stepCount, setStepCount] = React.useState(0);
  const [data, setData] = React.useState({
    autoPlay: false,
    ...initialAgentOptions
  });

  //   const takeAction = action => {
  //     const { newState, reward } = env.step(action);
  //     console.log("new state", newState);
  //     setState(newState);
  //   };

  const agentTookAction = (action, done, totalReward, info) => {
    if (action) {
      downActionObject.click();
    } else {
      upActionObject.click();
    }
    if (info.slipped) {
      agentObject.slip();
    }
    if (done) {
      if (totalReward > bestRewardNumberObject.val) {
        bestRewardNumberObject.updateVal(totalReward);
      }
      setData({ ...data, eps: agent.eps });
    }
    setStepCount(stepCount + 1);
  };

  const step = () => {
    const { action, done, totalReward, info } = game.step();
    agentTookAction(action, done, totalReward, info);
  };

  const resizeCanvas = () => {
    if (canvasRef.current) {
      canvasRef.current.width = size.width * window.devicePixelRatio;
      canvasRef.current.height = size.height * window.devicePixelRatio;
      const ctx = canvasRef.current.getContext("2d");
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      if (sceneRef.current) {
        sceneRef.current.size = size;
      }
    }
  };

  const handleKeyDown = e => {
    if (e.keyCode === 38) {
      // up arrow
      e.preventDefault();
      const { done, totalReward, info } = game.agentTakeAction(0);
      agentTookAction(0, done, totalReward, info);
    }
    if (e.keyCode === 40) {
      // down arrow
      e.preventDefault();
      const { done, totalReward, info } = game.agentTakeAction(1);
      agentTookAction(1, done, totalReward, info);
    }
  };

  const handleUpdate = data => {
    setData(data);
  };

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    resizeCanvas();

    sceneRef.current = new Scene(canvas, ctx, size, [
      environmentObject,
      tableObject,
      agentObject,
      rewardNumberObject,
      bestRewardNumberObject,
      downActionObject,
      upActionObject
    ]).render();
  }, []);

  React.useEffect(() => {
    game.reset();
  }, []);

  React.useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  });

  if (data.autoPlay) {
    window.setTimeout(step, 150);
  }

  agent.gamma = data.gamma;
  agent.lr = data.lr;
  agent.eps = data.eps;
  agent.epsDecay = data.epsDecay;

  resizeCanvas();

  agentObject.move(465 - 70 * (game.state || 0));

  tableObject.updateData(agent.qTable.slice().reverse());

  rewardNumberObject.updateVal(game.totalReward);

  return (
    <Page>
      <DatGui data={data} onUpdate={handleUpdate}>
        <DatNumber
          path="lr"
          label="Learning rate (α)"
          min={0}
          max={1}
          step={0.01}
        />
        <DatNumber
          path="eps"
          label="Rnd chance (ε)"
          min={0}
          max={1}
          step={0.01}
        />
        <DatNumber
          path="gamma"
          label="Discount rate (γ)"
          min={0}
          max={1}
          step={0.01}
        ></DatNumber>
        <DatNumber
          path="epsDecay"
          label="ε decay"
          min={0}
          max={1}
          step={0.01}
        ></DatNumber>
        <DatBoolean path="autoPlay" label="Auto-play"></DatBoolean>
        <DatButton label="Step" onClick={step} />
      </DatGui>
      <canvas
        style={{
          width: "100%",
          height: "100%",
          background: "black"
        }}
        ref={canvasRef}
      />
      <BellmanUpdateKatex state={game.state}></BellmanUpdateKatex>
    </Page>
  );
}

export default QLearningPage;
