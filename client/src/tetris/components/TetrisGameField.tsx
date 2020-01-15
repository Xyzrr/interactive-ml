import React, { useEffect } from "react";
import { TetrisFieldTile, ActivePiece } from "../types";
import { getColor, getMinos } from "../tetrominos";
import * as constants from "../constants";
import styled from "styled-components";

const addCoords = (a: [number, number], b: [number, number]) => {
  const result: [number, number] = [a[0] + b[0], a[1] + b[1]];
  return result;
};

const translate = (activePiece: ActivePiece, translation: [number, number]) => {
  return {
    ...activePiece,
    position: addCoords(activePiece.position, translation)
  };
};

const activePieceIsColliding = (
  activePiece: ActivePiece,
  field: TetrisFieldTile[][]
) => {
  const minos = getMinos(activePiece.pieceType, activePiece.orientation);

  for (const coord of minos) {
    const pos = addCoords(activePiece.position, coord);
    if (
      pos[0] < 0 ||
      pos[0] >= constants.MATRIX_ROWS ||
      pos[1] < 0 ||
      pos[1] >= constants.MATRIX_COLS ||
      field[pos[0]][pos[1]]
    ) {
      return true;
    }
  }
  return false;
};

const moveToGround = (activePiece: ActivePiece, field: TetrisFieldTile[][]) => {
  let testShift = 0;
  while (
    !activePieceIsColliding(translate(activePiece, [testShift, 0]), field)
  ) {
    testShift++;
  }
  return translate(activePiece, [testShift - 1, 0]);
};

const TetrisGameFieldDiv = styled.div`
  position: relative;
  .field-foreground {
    top: 0;
    left: 0;
    position: absolute;
  }
`;

interface TetrisGameFieldProps {
  unit: number;
  field: TetrisFieldTile[][];
  activePiece?: ActivePiece;
}

const TetrisGameField: React.FC<TetrisGameFieldProps> = props => {
  const width = props.unit * 10;
  const height = props.unit * 20;

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const ctx = canvasRef.current && canvasRef.current.getContext("2d");

  const backgroundCanvasRef = React.useRef<HTMLCanvasElement>(null);

  const renderLand = (ctx: CanvasRenderingContext2D) => {
    props.field.forEach((row, i) => {
      row.forEach((cell, j) => {
        if (cell !== 0) {
          ctx.fillStyle = getColor(cell);
          ctx.fillRect(
            props.unit * j,
            props.unit * (i - 20),
            props.unit,
            props.unit
          );
        }
      });
    });
  };

  const renderActivePiece = (
    ctx: CanvasRenderingContext2D,
    activePiece: ActivePiece,
    ghost: boolean = false
  ) => {
    for (const coord of getMinos(
      activePiece.pieceType,
      activePiece.orientation
    )) {
      ctx.fillStyle = ghost
        ? getColor(activePiece.pieceType, constants.GHOST_ALPHA)
        : getColor(activePiece.pieceType);
      ctx.fillRect(
        (activePiece.position[1] + coord[1]) * props.unit,
        (activePiece.position[0] + coord[0] - 20) * props.unit,
        props.unit,
        props.unit
      );
    }
  };

  const render = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, width, height);
    renderLand(ctx);
    if (props.activePiece) {
      renderActivePiece(ctx, props.activePiece);
      const ghostPiece = moveToGround(props.activePiece, props.field);
      renderActivePiece(ctx, ghostPiece, true);
    }
  };

  useEffect(() => {
    const renderGrid = (ctx: CanvasRenderingContext2D) => {
      ctx.strokeStyle = "#161616";
      for (let i = 0; i < constants.MATRIX_ROWS; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * props.unit);
        ctx.lineTo(width, i * props.unit);
        ctx.stroke();
      }
      for (let j = 0; j < constants.MATRIX_COLS; j++) {
        ctx.beginPath();
        ctx.moveTo(j * props.unit, 0);
        ctx.lineTo(j * props.unit, height);
        ctx.stroke();
      }
    };

    if (backgroundCanvasRef.current) {
      backgroundCanvasRef.current.width = width * window.devicePixelRatio;
      backgroundCanvasRef.current.height = height * window.devicePixelRatio;

      const ctx = backgroundCanvasRef.current.getContext("2d");
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        renderGrid(ctx);
      }
    }

    if (canvasRef.current) {
      canvasRef.current.width = width * window.devicePixelRatio;
      canvasRef.current.height = height * window.devicePixelRatio;

      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    }
  }, [width, height, props.unit]);

  if (ctx) {
    render(ctx);
  }

  return (
    <TetrisGameFieldDiv>
      <canvas
        className="field-background"
        style={{ width, height, border: "1px solid #666" }}
        ref={backgroundCanvasRef}
      ></canvas>
      <canvas
        className="field-foreground"
        style={{ width, height, border: "1px solid #666" }}
        ref={canvasRef}
      ></canvas>
    </TetrisGameFieldDiv>
  );
};

export default TetrisGameField;
