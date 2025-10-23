import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "clear expired locks",
  { seconds: 10 },
  internal.general.releaseExpiredLocks,
);

crons.interval(
  "fetch vSphere data",
  { minutes: 1 },
  internal.vsphere.fetchHostMutation,
  {},
);

crons.interval("index vSphere", { minutes: 30 }, internal.vsphere.reindex, {});

export default crons;
