import React from "react";

import styled from "styled-components";
import TetrisGameFrame from "../components/TetrisGameFrame";
import { tetrisReducer, PlayerState, ServerState } from "../reducers";
import * as constants from "../constants";
import { unstable_batchedUpdates } from "react-dom";
import * as _ from "lodash";
import produce from "immer";
import "../wasm_exec";

export let clientID: string | undefined = undefined;
export let globals = {
  frameStartTime: 0,
  serverTimeOffset: 0,
  actionIndex: 0
};

const keyBindings = {
  moveLeft: 37,
  moveRight: 39,
  rotateClockwise: 38,
  rotateCounterClockwise: 90,
  softDrop: 40,
  hardDrop: 32,
  hold: 67
};

const keyDown: {
  [key: string]: { downTime: number; lastTriggered: number };
} = {};

const TetrisPageDiv = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  flex-wrap: wrap;
  background: black;
`;

export interface PlayerInput {
  time: number;
  index: number;
  command: number;
}

export let playerInputs: PlayerInput[] = [];

async function startLocalGameEngine() {
  // @ts-ignore
  const go = new Go();
  console.log("fetching go");
  // @ts-ignore
  let { instance, module } = await WebAssembly.instantiateStreaming(
    fetch("main.wasm"),
    go.importObject
  );
  console.log("finished fetching");
  await go.run(instance);
  console.log("go program halted");
}

//TODO: fix types
const goToJSState = (s: any) => {
  return produce(s, (draft: any) => {
    for (const clientID of Object.keys(s.playerStates)) {
      draft.playerStates[clientID] = goToJSPlayerState(
        s.playerStates[clientID]
      );
    }
  }) as any;
};

export const goToJSPlayerState = (s: any) => {
  return {
    ...s,
    activePiece: {
      ...s.activePiece,
      position: [s.activePiece.position.row, s.activePiece.position.col]
    }
  } as PlayerState;
};

export const jsToGoPlayerState = (s: PlayerState) => {
  return {
    ...s,
    activePiece: s.activePiece
      ? {
          ...s.activePiece,
          position: {
            row: s.activePiece.position[0],
            col: s.activePiece.position[1]
          }
        }
      : undefined
  };
};

const TetrisPage: React.FC = () => {
  const [state, dispatch] = React.useReducer(tetrisReducer, {
    serverState: { playerStates: {} },
    predictedStates: [null],
    inputHistory: []
  });

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (keyDown[e.keyCode]) {
        return;
      }
      switch (e.keyCode) {
        case keyBindings.moveLeft:
          sendInput(1);
          break;
        case keyBindings.moveRight:
          sendInput(2);
          break;
        case keyBindings.rotateClockwise:
          sendInput(3);
          break;
        case keyBindings.rotateCounterClockwise:
          sendInput(4);
          break;
        case keyBindings.softDrop:
          sendInput(5);
          break;
        case keyBindings.hardDrop:
          sendInput(6);
          break;
        case keyBindings.hold:
          sendInput(7);
          break;
      }
      keyDown[e.keyCode] = { downTime: Date.now(), lastTriggered: Date.now() };
    };

    const onKeyUp = (e: KeyboardEvent) => {
      delete keyDown[e.keyCode];
    };

    startLocalGameEngine();
    // const socket = new WebSocket("ws://34.67.102.3:8080/socket");
    const socket = new WebSocket("ws://localhost:8080/socket");
    socket.onopen = () => {
      socket.onmessage = m => {
        console.log("got message", m);

        let parsedData = JSON.parse(m.data);

        if (parsedData.messageType && parsedData.messageType === "id") {
          console.log("Got client ID", parsedData.id);
          clientID = parsedData.id;
          globals.frameStartTime = parsedData.time;
          globals.serverTimeOffset = Date.now() - globals.frameStartTime;

          window.setTimeout(update, 17);
          window.addEventListener("keydown", onKeyDown);
          window.addEventListener("keyup", onKeyUp);
        } else {
          let { newState, time } = parsedData;
          newState = goToJSState(newState);
          dispatch({
            type: "reconcileServerState",
            info: { newState, time }
          });
        }
      };
    };

    const sendInput = (command: number) => {
      const clientPlayerInput = {
        time: globals.frameStartTime,
        command,
        index: globals.actionIndex
      };
      playerInputs.push(clientPlayerInput);
      globals.actionIndex++;

      const serverPlayerInput = {
        playerID: clientID,
        ...clientPlayerInput
      };
      const SIMULATE_POOR_CONNECTION = true;
      if (SIMULATE_POOR_CONNECTION) {
        window.setTimeout(() => {
          socket.send(JSON.stringify(serverPlayerInput));
        }, 500);
      } else {
        socket.send(JSON.stringify(serverPlayerInput));
      }
    };

    const update = () => {
      globals.frameStartTime += 17;
      dispatch({
        type: "predictState",
        info: playerInputs
      });
      playerInputs = [];

      unstable_batchedUpdates(() => {
        const time = Date.now();

        // dispatch({
        //   type: "tick",
        //   info: { softDrop: keyDown[keyBindings.softDrop] }
        // });

        const rightKey = keyDown[keyBindings.moveRight];
        if (
          rightKey &&
          time - rightKey.downTime >= constants.DAS &&
          time - rightKey.lastTriggered >= constants.ARR
        ) {
          sendInput(2);
          if (rightKey.lastTriggered === rightKey.downTime) {
            rightKey.lastTriggered += constants.DAS;
          } else {
            rightKey.lastTriggered += constants.ARR;
          }
        }

        const leftKey = keyDown[keyBindings.moveLeft];
        if (
          leftKey &&
          time - leftKey.downTime >= constants.DAS &&
          time - leftKey.lastTriggered >= constants.ARR
        ) {
          sendInput(1);
          if (leftKey.lastTriggered === leftKey.downTime) {
            leftKey.lastTriggered += constants.DAS;
          } else {
            leftKey.lastTriggered += constants.ARR;
          }
        }

        const downKey = keyDown[keyBindings.softDrop];
        if (downKey && time - downKey.lastTriggered >= constants.ARR) {
          sendInput(5);
          downKey.lastTriggered += constants.ARR;
        }
      });

      const msUntilNextUpdate =
        globals.frameStartTime + 17 - (Date.now() - globals.serverTimeOffset);
      window.setTimeout(update, msUntilNextUpdate);
    };
  }, []);

  return (
    <TetrisPageDiv>
      {Object.keys(state.serverState.playerStates).map(cid => {
        let clientState: PlayerState | null;
        if (cid === clientID) {
          console.log("correct client ID", cid, clientID);
          clientState = state.predictedStates[state.predictedStates.length - 1];
        } else {
          console.log("wrong client ID", cid, clientID);
          clientState = state.serverState.playerStates[cid];
        }
        if (clientState == null) {
          return <></>;
        }
        return (
          <TetrisGameFrame
            key={cid}
            field={clientState.field}
            activePiece={clientState.activePiece}
            hold={clientState.hold}
            nextPieces={clientState.nextPieces}
            held={clientState.held}
          ></TetrisGameFrame>
        );
      })}
    </TetrisPageDiv>
  );
};

export default TetrisPage;
