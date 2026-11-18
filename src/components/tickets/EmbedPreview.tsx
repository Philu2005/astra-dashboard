import React from 'react';
import astraLogo from '@/assets/Idee_2_blau.jpg';

export interface EmbedPreviewProps {
  title?: string;
  description?: string;
}

const EMBED_COLOR = '#4b46c8';

export const EmbedPreview: React.FC<EmbedPreviewProps> = ({
  title,
  description,
}) => {
  const hasContent = title || description;

  return (
    <div className="space-y-2">
      <p className="text-[0.8rem] font-medium text-[#8b8fad]">Vorschau</p>

      {/* Discord message container */}
      <div className="rounded-lg bg-[#313338] p-3">
        {/* Bot header */}
        <div className="mb-2 flex items-center gap-2">
          <img
            src={astraLogo}
            alt="Astra"
            className="h-6 w-6 rounded-full object-cover"
          />
          <span className="text-[0.85rem] font-semibold text-white">Astra</span>
          <span className="rounded bg-[#5865f2] px-1 py-[1px] text-[0.6rem] font-semibold uppercase text-white leading-tight">APP</span>
        </div>

        {/* Embed */}
        <div className="ml-8 overflow-hidden rounded bg-[#2b2d31]">
          <div className="flex">
            {/* Color bar */}
            <div className="w-1 shrink-0" style={{ backgroundColor: EMBED_COLOR }} />
            <div className="flex-1 min-w-0 p-3">
              <div className="flex gap-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                  {title && (
                    <p className="text-[0.95rem] font-semibold text-white leading-tight">{title}</p>
                  )}
                  {description && (
                    <p className="text-[0.85rem] text-[#dbdee1] leading-relaxed whitespace-pre-wrap break-words">{description}</p>
                  )}
                </div>
                {/* Thumbnail – Astra logo */}
                <div className="shrink-0">
                  <img
                    src={astraLogo}
                    alt="Thumbnail"
                    className="h-[60px] w-[60px] rounded object-cover"
                  />
                </div>
              </div>
              {/* Footer (fixed, not configurable) */}
              <div className="mt-3">
                <p className="text-[0.72rem] leading-snug text-[#a6a8ad]">
                  Klicke auf den Button, um ein Ticket zu erstellen!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Button – below embed, Discord-style green */}
        <div className="ml-8 mt-2">
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#248046] px-4 py-2 text-[0.85rem] font-medium text-white cursor-default hover:bg-[#1a6334] transition-colors"
          >
            <span>Ticket öffnen</span>
          </button>
        </div>
      </div>

      {!hasContent && (
        <p className="text-[0.78rem] text-[#8b8fad] italic">Fülle die Felder aus, um eine Vorschau zu sehen.</p>
      )}
    </div>
  );
};

export default EmbedPreview;
