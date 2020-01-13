import React from "react";

import styled from "styled-components";
import TetrisGameFrame from "../components/TetrisGameFrame";
import { TetrisFieldTile } from "../types";
import { tetrisReducer, popNextActivePiece } from "../reducers";
import * as constants from "../constants";
import { unstable_batchedUpdates } from "react-dom";
import * as _ from "lodash";

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

async function doStuff() {
  // @ts-ignore
  const go = new Go();
  // @ts-ignore
  let { instance, module } = await WebAssembly.instantiateStreaming(
    fetch("main.wasm"),
    go.importObject
  );
  window.setTimeout(() => {
    console.log("trying sketch stuff");
    // @ts-ignore
    printMessage("JS calling Go and back again!", (err, message) => {
      if (err) {
        console.error(err);
        return;
      }

      console.log(message);
    });
  }, 1000);
  await go.run(instance);
}

const TetrisPage: React.FC = () => {
  // const testField: TetrisFieldTile[][] = new Array(constants.MATRIX_ROWS).fill(
  //   new Array(constants.MATRIX_COLS).fill(0)
  // );
  // const {
  //   activePiece: initialActivePiece,
  //   nextPieces: initialBag
  // } = popNextActivePiece([]);
  // const [state, dispatch] = React.useReducer(tetrisReducer, {
  //   field: testField,
  //   hold: undefined,
  //   held: false,
  //   activePiece: initialActivePiece,
  //   nextPieces: initialBag
  // });
  const [state, dispatch] = React.useReducer(tetrisReducer, {});

  let clientID: string | undefined = undefined;

  React.useEffect(() => {
    doStuff();
    // const socket = new WebSocket("ws://34.67.102.3:8080/socket");
    const socket = new WebSocket("ws://localhost:8080/socket");
    socket.onopen = () => {
      socket.onmessage = m => {
        console.log("got message", m);
        const parsedData = JSON.parse(m.data);
        // console.log("parsed data", _.cloneDeep(parsedData));
        if (parsedData.type && parsedData.type === "id") {
          console.log("Got client ID", parsedData.id);
          clientID = parsedData.id;
        } else {
          for (const clientID of Object.keys(parsedData)) {
            const clientState = parsedData[clientID];
            clientState.activePiece.position = [
              clientState.activePiece.position.row,
              clientState.activePiece.position.col
            ];
          }
          dispatch({
            type: "replaceState",
            info: parsedData
          });
        }
      };
    };

    const sendInput = (input: any) => {
      const SIMULATE_POOR_CONNECTION = false;
      if (SIMULATE_POOR_CONNECTION) {
        window.setTimeout(() => {
          socket.send(JSON.stringify(input));
        }, 500);
      } else {
        socket.send(JSON.stringify(input));
      }
    };

    const update = () => {
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
          sendInput({ playerID: clientID, command: 2, time: Date.now() });
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
          sendInput({ playerID: clientID, command: 1, time: Date.now() });
          if (leftKey.lastTriggered === leftKey.downTime) {
            leftKey.lastTriggered += constants.DAS;
          } else {
            leftKey.lastTriggered += constants.ARR;
          }
        }

        const downKey = keyDown[keyBindings.softDrop];
        if (downKey && time - downKey.lastTriggered >= constants.ARR) {
          sendInput({ playerID: clientID, command: 5, time: Date.now() });
          downKey.lastTriggered += constants.ARR;
        }
      });

      window.requestAnimationFrame(update);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (keyDown[e.keyCode]) {
        return;
      }
      switch (e.keyCode) {
        case keyBindings.moveLeft:
          sendInput({ playerID: clientID, command: 1, time: Date.now() });
          break;
        case keyBindings.moveRight:
          sendInput({ playerID: clientID, command: 2, time: Date.now() });
          break;
        case keyBindings.rotateClockwise:
          sendInput({ playerID: clientID, command: 3, time: Date.now() });
          break;
        case keyBindings.rotateCounterClockwise:
          sendInput({ playerID: clientID, command: 4, time: Date.now() });
          break;
        case keyBindings.softDrop:
          sendInput({ playerID: clientID, command: 5, time: Date.now() });
          break;
        case keyBindings.hardDrop:
          sendInput({ playerID: clientID, command: 6, time: Date.now() });
          break;
        case keyBindings.hold:
          sendInput({ playerID: clientID, command: 7, time: Date.now() });
          break;
      }
      keyDown[e.keyCode] = { downTime: Date.now(), lastTriggered: Date.now() };
    };

    const onKeyUp = (e: KeyboardEvent) => {
      delete keyDown[e.keyCode];
    };

    window.requestAnimationFrame(update);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
  }, []);

  // console.log("state", state);

  return (
    <TetrisPageDiv>
      {Object.keys(state).map(clientID => {
        const clientState = state[clientID];
        return (
          <TetrisGameFrame
            key={clientID}
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
