import { useState, useEffect } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import { normalizeImageUrl } from './image-viewer';

interface ImageLightboxProps {
  imageUrl: string;
  altText?: string;
  isOpen: boolean;
  onClose: () => void;
  showThumbnails?: boolean;
}

export function ImageLightbox({ 
  imageUrl, 
  altText = 'صورة', 
  isOpen,
  onClose,
  showThumbnails = true 
}: ImageLightboxProps) {
  // التأكد من أن المسار يبدأ بـ / إذا كان مسارًا محليًا
  const fullImageUrl = normalizeImageUrl(imageUrl);

  return (
    <Lightbox
      open={isOpen}
      close={onClose}
      slides={[{ src: fullImageUrl, alt: altText }]}
      plugins={showThumbnails ? [Zoom, Thumbnails] : [Zoom]}
      carousel={{ finite: true }}
      render={{
        iconPrev: () => <span className="rtl:transform rtl:rotate-180">السابق</span>,
        iconNext: () => <span className="rtl:transform rtl:rotate-180">التالي</span>,
        iconClose: () => <span>إغلاق</span>,
      }}
    />
  );
}