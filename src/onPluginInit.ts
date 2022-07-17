import { NodePluginArgs } from "gatsby";
import throat from "throat";

export const jobsQueue = throat(1);

export function onPluginInit({ reporter }: NodePluginArgs) {
  reporter.info("Initialising bond transformer video");
}
