import assert from "node:assert/strict";
import test from "node:test";

import {
  KIND_APPROVAL_REQUEST,
  KIND_STREAM_MESSAGE_V2,
  KIND_JOB_ACCEPTED,
} from "../../../shared/constants/kinds.ts";
import {
  DEFAULT_SENDER_SOUNDS,
  DEFAULT_SLOT_SOUNDS,
  SENDER_SOUND_SLOTS,
  SOUND_SLOTS,
  notificationSoundForSlot,
  resolveEventSound,
  resolveSlotSound,
  shouldPlayNotificationSound,
  slotForFeedKind,
} from "./sound.ts";

const prefs = {
  sounds: { ...DEFAULT_SLOT_SOUNDS, needs_action: "bong", dm: "doop" },
  senderSounds: { human: "flutter", agent: "amp" },
};

test("human mentions use amp while other human message slots stay silent", () => {
  for (const slot of SENDER_SOUND_SLOTS) {
    assert.equal(
      resolveEventSound(prefs, slot, false),
      slot === "mention" ? "amp" : null,
    );
  }
});

test("agent message slots never resolve an automatic sound", () => {
  for (const slot of SENDER_SOUND_SLOTS) {
    assert.equal(resolveEventSound(prefs, slot, true), null);
  }
});

test("only mentions have an audible notification policy", () => {
  assert.equal(notificationSoundForSlot("mention"), "amp");
  assert.equal(notificationSoundForSlot("dm"), null);
  assert.equal(notificationSoundForSlot("thread_reply"), null);
  assert.equal(notificationSoundForSlot("needs_action"), null);
});

test("non-message slots keep their per-slot sound regardless of sender", () => {
  for (const slot of SOUND_SLOTS) {
    if (SENDER_SOUND_SLOTS.has(slot)) continue;
    assert.equal(resolveEventSound(prefs, slot, false), prefs.sounds[slot]);
    assert.equal(resolveEventSound(prefs, slot, true), prefs.sounds[slot]);
  }
});

test("resolveSlotSound ignores sender sounds", () => {
  assert.equal(resolveSlotSound(prefs, "dm"), "doop");
});

test("default sender sounds are human ping, agent amp", () => {
  assert.deepEqual(DEFAULT_SENDER_SOUNDS, { human: "ping", agent: "amp" });
});

test("routes each feed category to its own sound slot", () => {
  assert.equal(slotForFeedKind(KIND_STREAM_MESSAGE_V2, "mention"), "mention");
  assert.equal(
    slotForFeedKind(KIND_APPROVAL_REQUEST, "needs_action"),
    "needs_action",
  );
  assert.equal(
    slotForFeedKind(KIND_STREAM_MESSAGE_V2, "activity"),
    "needs_action",
  );
  assert.equal(
    slotForFeedKind(KIND_STREAM_MESSAGE_V2, "agent_activity"),
    "needs_action",
  );
});

test("agent job kinds pick their slot for non-mention categories", () => {
  assert.equal(
    slotForFeedKind(KIND_JOB_ACCEPTED, "agent_activity"),
    "job_accepted",
  );
});

test("a mention outranks the agent job kind that carried it", () => {
  assert.equal(slotForFeedKind(KIND_JOB_ACCEPTED, "mention"), "mention");
});

test("unknown category falls back to needs_action and warns", () => {
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => warnings.push(args.join(" "));
  try {
    // The backend once emitted the plural section name here; the fallback
    // keeps the user alerted while the warning keeps the drift visible.
    assert.equal(
      slotForFeedKind(KIND_STREAM_MESSAGE_V2, "mentions"),
      "needs_action",
    );
  } finally {
    console.warn = originalWarn;
  }
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /unknown feed item category "mentions"/);
});

test("silences notifications from Huddle backing channels", () => {
  const silentChannelIds = new Set(["active-huddle"]);

  assert.equal(
    shouldPlayNotificationSound("active-huddle", silentChannelIds),
    false,
  );
  assert.equal(
    shouldPlayNotificationSound("ordinary-channel", silentChannelIds),
    true,
  );
  assert.equal(shouldPlayNotificationSound(null, silentChannelIds), true);
});
