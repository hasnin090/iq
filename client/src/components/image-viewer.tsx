import { useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

interface ImageViewerProps {
  imageUrl: string;
  altText?: string;
  showThumbnails?: boolean;
}

export function ImageViewer({ imageUrl, altText = 'صورة', showThumbnails = false }: ImageViewerProps) {
  const [open, setOpen] = useState(false);

  // التأكد من أن المسار يبدأ بـ / إذا كان مسارًا محليًا
  const fullImageUrl = imageUrl.startsWith('http') 
    ? imageUrl 
    : imageUrl.startsWith('./') 
      ? imageUrl.substring(1) 
      : imageUrl.startsWith('/') 
        ? imageUrl 
        : `/${imageUrl}`;

  return (
    <>
      <div className="relative group">
        <img 
          src={fullImageUrl} 
          alt={altText}
          className="w-full h-auto object-contain rounded-md cursor-pointer max-h-48 border border-gray-300"
          onClick={() => setOpen(true)}
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-md">
          <Button 
            size="sm"
            variant="secondary"
            className="mr-2"
            onClick={() => setOpen(true)}
          >
            <Eye className="h-4 w-4 ml-2" />
            عرض الصورة
          </Button>
        </div>
      </div>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={[{ src: fullImageUrl, alt: altText }]}
        plugins={showThumbnails ? [Zoom, Thumbnails] : [Zoom]}
        carousel={{ finite: true }}
        render={{
          iconPrev: () => <span className="rtl:transform rtl:rotate-180">السابق</span>,
          iconNext: () => <span className="rtl:transform rtl:rotate-180">التالي</span>,
          iconClose: () => <span>إغلاق</span>,
        }}
      />
    </>
  );
}

// مكون لعرض مجموعة صور
export function MultiImageViewer({ images }: { images: string[] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const slides = images.map(img => ({
    src: img.startsWith('http') ? img : img.startsWith('./') ? img.substring(1) : img.startsWith('/') ? img : `/${img}`,
    alt: 'صورة'
  }));

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {images.map((img, idx) => (
          <div key={idx} className="relative group">
            <img 
              src={img.startsWith('http') ? img : img.startsWith('./') ? img.substring(1) : img.startsWith('/') ? img : `/${img}`}
              alt={`صورة ${idx + 1}`}
              className="w-full h-24 sm:h-32 object-cover rounded-md cursor-pointer border border-gray-300"
              onClick={() => {
                setIndex(idx);
                setOpen(true);
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-md">
              <Button 
                size="sm"
                variant="secondary"
                className="mr-2"
                onClick={() => {
                  setIndex(idx);
                  setOpen(true);
                }}
              >
                <Eye className="h-4 w-4 ml-2" />
                عرض
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={slides}
        plugins={[Zoom, Thumbnails]}
        index={index}
        render={{
          iconPrev: () => <span className="rtl:transform rtl:rotate-180">السابق</span>,
          iconNext: () => <span className="rtl:transform rtl:rotate-180">التالي</span>,
          iconClose: () => <span>إغلاق</span>,
        }}
      />
    </>
  );
}