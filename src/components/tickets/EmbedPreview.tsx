import React from 'react';

export interface EmbedPreviewProps {
  title?: string;
  description?: string;
  color?: string;
  footer?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  buttonLabel?: string;
  buttonEmoji?: string;
}

const DEFAULT_COLOR = '#4b46c8';

export const EmbedPreview: React.FC<EmbedPreviewProps> = ({
  title,
  description,
  color,
  footer,
  imageUrl,
  thumbnailUrl,
  buttonLabel,
  buttonEmoji,
}) => {
  const barColor = color || DEFAULT_COLOR;
  const hasContent = title || description || footer || imageUrl || thumbnailUrl;

  return (
    <div className="space-y-2">
      <p className="text-[0.8rem] font-medium text-[#8b8fad]">Vorschau</p>
      <div className="rounded-lg bg-[#2b2d31] p-0 overflow-hidden">
        <div className="flex">
          {/* Color bar */}
          <div className="w-1 shrink-0 rounded-l" style={{ backgroundColor: barColor }} />
          <div className="flex-1 p-3 min-w-0">
            <div className="flex gap-3">
              <div className="flex-1 min-w-0 space-y-1.5">
                {title && (
                  <p className="text-[0.95rem] font-semibold text-white leading-tight">{title}</p>
                )}
                {description && (
                  <p className="text-[0.85rem] text-[#dbdee1] leading-relaxed whitespace-pre-wrap break-words">{description}</p>
                )}
                {imageUrl && (
                  <div className="mt-2 max-w-[300px]">
                    <img
                      src={imageUrl}
                      alt="Embed-Bild"
                      className="rounded max-h-[200px] w-auto object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>
              {thumbnailUrl && (
                <div className="shrink-0">
                  <img
                    src={thumbnailUrl}
                    alt="Thumbnail"
                    className="h-16 w-16 rounded object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
            {footer && (
              <p className="mt-2 text-[0.75rem] text-[#949ba4]">{footer}</p>
            )}
          </div>
        </div>
      </div>
      {/* Button preview */}
      <div className="flex">
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#5865f2] px-4 py-1.5 text-[0.85rem] font-medium text-white opacity-90 cursor-default"
        >
          {buttonEmoji && <span>{buttonEmoji}</span>}
          <span>{buttonLabel || 'Ticket erstellen'}</span>
        </button>
      </div>
      {!hasContent && (
        <p className="text-[0.78rem] text-[#8b8fad] italic">Fülle die Felder aus, um eine Vorschau zu sehen.</p>
      )}
    </div>
  );
};

export default EmbedPreview;
