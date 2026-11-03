export type SectionOutline = {
  name: string;
  channels: string[];
};

export type PlannedSection = {
  name: string;
  existingSectionId: string | null;
  channelIds: string[];
  unmatched: string[];
};

const CHANNEL_LINE = /^(\s+|[-*•]\s*|#)/;

export function normalizeChannelName(name: string): string {
  return name
    .trim()
    .replace(/^#/, "")
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
}

/**
 * Parses a plain-text outline: unindented lines are section names; lines that
 * start with `#`, a bullet, or indentation are channels in the section above.
 */
export function parseSectionOutline(text: string): SectionOutline[] {
  const outline: SectionOutline[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (line.trim().length === 0) continue;
    if (CHANNEL_LINE.test(line)) {
      const current = outline.at(-1);
      const channel = line.replace(/^\s*[-*•]?\s*/, "").trim();
      if (current && channel.replace(/^#/, "").length > 0) {
        current.channels.push(channel);
      }
      continue;
    }
    const name = line.trim().replace(/:$/, "").trim();
    if (name.length > 0) outline.push({ name, channels: [] });
  }
  return outline;
}

export function planSectionImport(
  outline: SectionOutline[],
  channels: ReadonlyArray<{ id: string; name: string }>,
  existingSections: ReadonlyArray<{ id: string; name: string }>,
): PlannedSection[] {
  const channelIdByName = new Map<string, string>();
  for (const channel of channels) {
    const key = normalizeChannelName(channel.name);
    if (!channelIdByName.has(key)) channelIdByName.set(key, channel.id);
  }
  const sectionIdByName = new Map(
    existingSections.map((s) => [s.name.trim().toLowerCase(), s.id]),
  );

  const planned = new Map<string, PlannedSection>();
  const claimed = new Set<string>();
  for (const entry of outline) {
    const key = entry.name.toLowerCase();
    let section = planned.get(key);
    if (!section) {
      section = {
        name: entry.name,
        existingSectionId: sectionIdByName.get(key) ?? null,
        channelIds: [],
        unmatched: [],
      };
      planned.set(key, section);
    }
    for (const raw of entry.channels) {
      const channelId = channelIdByName.get(normalizeChannelName(raw));
      if (!channelId) {
        section.unmatched.push(raw.replace(/^#/, ""));
      } else if (!claimed.has(channelId)) {
        claimed.add(channelId);
        section.channelIds.push(channelId);
      }
    }
  }
  return [...planned.values()];
}
