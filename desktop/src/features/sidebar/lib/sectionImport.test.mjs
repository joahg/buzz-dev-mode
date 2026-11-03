import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeChannelName,
  parseSectionOutline,
  planSectionImport,
} from "./sectionImport.ts";

test("parseSectionOutline reads headers and #, bullet, and indented channels", () => {
  const outline = parseSectionOutline(
    [
      "Team:",
      "#agent-ops",
      "- #agent-autonomy",
      "",
      "Projects",
      "  buzz-dev",
      "• kgoose",
      "#",
    ].join("\n"),
  );
  assert.deepEqual(outline, [
    { name: "Team", channels: ["#agent-ops", "#agent-autonomy"] },
    { name: "Projects", channels: ["buzz-dev", "kgoose"] },
  ]);
});

test("parseSectionOutline drops channels that appear before any header", () => {
  assert.deepEqual(parseSectionOutline("#orphan\nTeam\n#a"), [
    { name: "Team", channels: ["#a"] },
  ]);
});

test("normalizeChannelName ignores case, #, spaces, and underscores", () => {
  assert.equal(normalizeChannelName(" #Agent_Ops Team "), "agent-ops-team");
});

test("planSectionImport matches channels, reuses sections, and reports misses", () => {
  const plan = planSectionImport(
    [
      { name: "Team", channels: ["#Agent-Ops", "#missing"] },
      { name: "projects", channels: ["buzz_dev", "agent-ops"] },
      { name: "team", channels: ["#general"] },
    ],
    [
      { id: "c1", name: "agent-ops" },
      { id: "c2", name: "buzz-dev" },
      { id: "c3", name: "general" },
    ],
    [{ id: "s1", name: "Projects" }],
  );
  assert.deepEqual(plan, [
    {
      name: "Team",
      existingSectionId: null,
      channelIds: ["c1", "c3"],
      unmatched: ["missing"],
    },
    {
      name: "projects",
      existingSectionId: "s1",
      channelIds: ["c2"],
      unmatched: [],
    },
  ]);
});
