import * as React from "react";

import { useChannelsQuery } from "@/features/channels/hooks";
import { useOpenChannelDirectoryQuery } from "@/features/channels/openChannelDirectory";
import type { Channel } from "@/shared/api/types";

/**
 * Open channels the user hasn't joined: the palette searches these and
 * joins on enter, but they stay out of the left navigator until joined.
 *
 * The member-only 60s poll (`get_channels`) no longer carries non-member
 * channels — they come from the separate `get_open_channel_directory`
 * scan. Pass `active` while a discovery surface (the palette) is open so
 * the unbounded scan runs only on demand; when inactive the hook serves
 * whatever directory the session has already warmed.
 */
export function useDiscoverableChannels(active: boolean): Channel[] {
  const memberChannels = useChannelsQuery().data;
  const directory = useOpenChannelDirectoryQuery({ enabled: active }).data;
  return React.useMemo(() => {
    const memberIds = new Set(
      (memberChannels ?? []).map((channel) => channel.id),
    );
    return (directory ?? []).filter(
      (channel) =>
        channel.channelType === "stream" &&
        !memberIds.has(channel.id) &&
        channel.visibility === "open" &&
        channel.archivedAt === null,
    );
  }, [directory, memberChannels]);
}
