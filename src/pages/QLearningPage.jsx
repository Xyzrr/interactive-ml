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
import AgentObject from "../scene-objects/Agent";
import Scene from "../Scene";
import NumberObject from "../scene-objects/Number";
import ButtonObject from "../scene-objects/ButtonObject";
import DatGui, { DatNumber, DatButton } from "react-dat-gui";

const env = new NChainEnv();
const agent = new QLearningAgent();
const game = new Game(env, agent);

const tableObject = new Table({ x: 50, y: 150 }, agent.qTable);
const rewardNumberObject = new NumberObject({ x: 430, y: 330 }, 0, {
  textAlign: "left",
  font: "40px Inconsolata",
  precision: 0
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
  const [data, setData] = React.useState({});

  //   const takeAction = action => {
  //     const { newState, reward } = env.step(action);
  //     console.log("new state", newState);
  //     setState(newState);
  //   };

  const agentTookAction = action => {
    if (action) {
      downActionObject.click();
    } else {
      upActionObject.click();
    }
    setStepCount(stepCount + 1);
  };

  const step = () => {
    const { action, done } = game.step();
    agentTookAction(action);
  };

  const startRecording = () => {
    if (sceneRef.current) {
      sceneRef.current.startRecording();
    }
  };
  const stopRecording = () => {
    if (sceneRef.current) {
      sceneRef.current.stopRecording();
    }
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
      game.agentTakeAction(0);
      agentTookAction(0);
    }
    if (e.keyCode === 40) {
      // down arrow
      e.preventDefault();
      game.agentTakeAction(1);
      agentTookAction(1);
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
      downActionObject,
      upActionObject
    ]);

    sceneRef.current.render();
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
          path="epsilon"
          label="Rnd chance (ε)"
          min={0}
          max={1}
          step={0.01}
        />
        <DatNumber
          path="discountRate"
          label="Discount rate (γ)"
          min={0}
          max={1}
          step={0.01}
        ></DatNumber>
        <DatButton label="Step" onClick={step} />
        <DatButton label="Record" onClick={startRecording} />
        <DatButton label="Stop" onClick={stopRecording} />
      </DatGui>
      <canvas
        style={{
          width: "100%",
          height: "100%",
          background: "black"
        }}
        ref={canvasRef}
      />
    </Page>
  );
}

export default QLearningPage;
