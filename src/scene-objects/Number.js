import * as colors from "../colors";
import TWEEN from "@tweenjs/tween.js";

export default class NumberObject {
  constructor(position, val, options) {
    options = {
      font: "30px Inconsolata",
      textAlign: "center",
      precision: 2,
      modifier: v => v,
      ...options
    };

    this.position = position;
    this.val = val;
    this.font = options.font;
    this.textAlign = options.textAlign;
    this.precision = options.precision;
    this.modifier = options.modifier;
    this.newVal = 0;
    this.newValColor = colors.red;
    this.newValOpacity = 0;
    this.newValOffset = 0;
    this.valOpacity = 1;
    this.valOffset = 0;
  }

  onAnimationFinish() {
    this.activeTween = new TWEEN.Tween(this)
      .to({ newValOpacity: 0 }, 2000)
      .start();
    this.valOpacity = 1;
    this.valOffset = 0;
    this.val = this.newVal;
  }

  updateVal(newVal, animationDuration = 400) {
    if (newVal === this.newVal) {
      return;
    }
    if (this.activeTween) {
      this.activeTween.stop();
    }

    if (newVal > this.val) {
      this.val = this.newVal;
      this.newVal = newVal;
      this.newValColor = colors.green;
      this.valOpacity = 1;
      this.newValOpacity = 0;
      this.valOffset = 0;
      this.newValOffset = -25;
      this.activeTween = new TWEEN.Tween(this)
        .to(
          {
            valOpacity: 0,
            newValOpacity: 1,
            valOffset: 25,
            newValOffset: 0
          },
          animationDuration
        )
        .onStop(this.onAnimationFinish.bind(this))
        .onComplete(this.onAnimationFinish.bind(this))
        .start();
    } else if (newVal < this.val) {
      this.val = this.newVal;
      this.newVal = newVal;
      this.newValColor = colors.red;
      this.valOpacity = 1;
      this.newValOpacity = 0;
      this.valOffset = 0;
      this.newValOffset = 25;
      this.activeTween = new TWEEN.Tween(this)
        .to(
          {
            valOpacity: 0,
            newValOpacity: 1,
            valOffset: -25,
            newValOffset: 0
          },
          animationDuration
        )
        .onStop(this.onAnimationFinish.bind(this))
        .onComplete(this.onAnimationFinish.bind(this))
        .start();
    }
  }

  render(ctx) {
    ctx.textAlign = this.textAlign;
    ctx.font = this.font;
    ctx.fillStyle = colors.withOpacity(colors.blue, this.valOpacity);
    ctx.fillText(
      this.modifier(this.val.toFixed(this.precision)),
      this.position.x,
      this.position.y + this.valOffset
    );
    ctx.fillStyle = colors.withOpacity(this.newValColor, this.newValOpacity);
    ctx.fillText(
      this.modifier(this.newVal.toFixed(this.precision)),
      this.position.x,
      this.position.y + this.newValOffset
    );
  }
}
