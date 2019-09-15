export default interface Agent {
  getAction(state: number): any;
  update(
    state: number,
    action: any,
    newState: number,
    reward: number,
    done: boolean
  ): void;
  finishEpisode(): void;
}
