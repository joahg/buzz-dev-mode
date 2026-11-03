import * as React from "react";

import type { Channel } from "@/shared/api/types";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Textarea } from "@/shared/ui/textarea";
import type { ChannelSection } from "@/features/sidebar/lib/useChannelSections";
import {
  parseSectionOutline,
  planSectionImport,
  type PlannedSection,
} from "@/features/sidebar/lib/sectionImport";

const PLACEHOLDER = `Team
#agent-ops
#agent-autonomy

Projects
#buzz-dev
#kgoose`;

type ImportSectionsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channels: ReadonlyArray<Channel>;
  sections: ReadonlyArray<ChannelSection>;
  onImport: (plan: PlannedSection[]) => void;
};

function ImportSectionsDialog({
  open,
  onOpenChange,
  channels,
  sections,
  onImport,
}: ImportSectionsDialogProps) {
  const [text, setText] = React.useState("");

  React.useEffect(() => {
    if (!open) setText("");
  }, [open]);

  const plan = React.useMemo(
    () => planSectionImport(parseSectionOutline(text), channels, sections),
    [text, channels, sections],
  );
  const matchedCount = plan.reduce((n, s) => n + s.channelIds.length, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import sections</DialogTitle>
          <DialogDescription>
            Paste an outline, such as your Slack sidebar: a section name on its
            own line, then its channels, each starting with #. Channels are
            matched to yours by name, and sections with the same name are
            reused.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          aria-label="Section outline"
          className="min-h-48 font-mono"
          data-testid="import-sections-input"
          onChange={(event) => setText(event.target.value)}
          placeholder={PLACEHOLDER}
          value={text}
        />
        {plan.length > 0 ? (
          <ul
            className="max-h-48 space-y-2 overflow-y-auto text-sm"
            data-testid="import-sections-preview"
          >
            {plan.map((section) => (
              <li key={section.name}>
                <span className="font-medium">{section.name}</span>
                <span className="text-muted-foreground">
                  {section.existingSectionId ? " (existing)" : " (new)"}
                  {` · ${section.channelIds.length} matched`}
                </span>
                {section.unmatched.length > 0 ? (
                  <div className="text-xs text-muted-foreground">
                    {`Not found: ${section.unmatched.join(", ")}`}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </DialogClose>
          <Button
            data-testid="import-sections-confirm"
            disabled={plan.length === 0}
            onClick={() => onImport(plan)}
            type="button"
          >
            {matchedCount === 1
              ? "Import 1 channel"
              : `Import ${matchedCount} channels`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useImportSectionsDialog({
  channels,
  sections,
  createSection,
  assignChannel,
}: {
  channels: ReadonlyArray<Channel>;
  sections: ReadonlyArray<ChannelSection>;
  createSection: (name: string) => ChannelSection | null;
  assignChannel: (channelId: string, sectionId: string) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const handleImport = React.useCallback(
    (plan: PlannedSection[]) => {
      for (const planned of plan) {
        const sectionId =
          planned.existingSectionId ?? createSection(planned.name)?.id;
        if (!sectionId) continue;
        for (const channelId of planned.channelIds) {
          assignChannel(channelId, sectionId);
        }
      }
      setOpen(false);
    },
    [createSection, assignChannel],
  );

  const dialog = (
    <ImportSectionsDialog
      channels={channels}
      onImport={handleImport}
      onOpenChange={setOpen}
      open={open}
      sections={sections}
    />
  );

  return { openImportSections: () => setOpen(true), dialog };
}
