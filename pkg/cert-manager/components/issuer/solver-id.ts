// RadioGroup needs a name that is unique across the page, and solvers are rendered as a list, so
// each mounted solver takes the next id from this module-level counter.
let solverCount = 0;

export function nextSolverId(): string {
  return `challengeType-${ solverCount++ }`;
}
