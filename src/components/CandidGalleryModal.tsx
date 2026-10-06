import React, { useState, useEffect } from 'react';
import { Camera, Download, Trash2, Image as ImageIcon, ShieldCheck, X } from 'lucide-react';
import { CandidSnapshotItem } from '../types';

interface CandidGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  gallery: CandidSnapshotItem[];
  onDeleteSnapshot: (id: string) => void;
  onClearGallery: () => void;
}

export const CandidGalleryModal: React.FC<CandidGalleryModalProps> = ({
  isOpen,
  onClose,
  gallery,
  onDeleteSnapshot,
  onClearGallery,
}) => {
  const [selectedImage, setSelectedImage] = useState<CandidSnapshotItem | null>(null);

  // Close modal or lightbox on ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedImage) {
          setSelectedImage(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedImage, onClose]);

  // Prevent background scroll and interaction when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownload = (item: CandidSnapshotItem) => {
    const link = document.createElement('a');
    link.href = item.image;
    link.download = `OVERWATCH_CANDID_${item.time.replace(/:/g, '')}_${item.id.slice(0, 4)}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    if (gallery.length === 0) return;
    gallery.forEach((item, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = item.image;
        link.download = `OVERWATCH_CANDID_${item.time.replace(/:/g, '')}_${item.id.slice(0, 4)}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 200);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in font-mono">
      <div className="relative w-full max-w-4xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] bg-[#06080e] border border-slate-800 rounded-lg shadow-2xl flex flex-col overflow-hidden cctv-brackets">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-[#030508] border-b border-slate-800 shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded bg-rose-950/80 border border-rose-500/60 text-rose-400 shrink-0">
              <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-bold text-slate-100">
                <span className="truncate">[CANDID_GALLERY]</span>
                <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] shrink-0 font-bold">
                  {gallery.length} 張
                </span>
              </div>
              <div className="text-[9px] sm:text-[10px] text-slate-500 truncate hidden xs:block sm:block">
                工位真實日常珍藏 • 野生表情趣味相簿
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {gallery.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleDownloadAll}
                  className="px-2 sm:px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-200 text-[10px] font-bold flex items-center gap-1 sm:gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
                  title="一次打包下載全輯照片"
                >
                  <Download className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="hidden sm:inline">一鍵下載全部</span>
                  <span className="sm:hidden">全部</span>
                  <span className="text-cyan-400 font-bold">({gallery.length})</span>
                </button>
                <button
                  type="button"
                  onClick={onClearGallery}
                  className="px-2 sm:px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 text-rose-300 text-[10px] flex items-center gap-1 transition cursor-pointer active:scale-95"
                  title="清空今日抓拍記錄"
                >
                  <Trash2 className="w-3 h-3 shrink-0" />
                  <span className="hidden md:inline">清空全輯</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 sm:p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition cursor-pointer flex items-center justify-center shrink-0"
              title="關閉"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Gallery Content Area */}
        <div className="flex-1 overflow-y-auto p-2.5 sm:p-4 custom-scrollbar">
          {gallery.length === 0 ? (
            <div className="py-12 sm:py-16 text-center flex flex-col items-center justify-center text-slate-500 px-4">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-3">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-300 mb-1.5">
                ✨ 今天狀態超棒，相簿目前還空空的！
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm leading-relaxed">
                保持好心情與活力！當你工作時不小心打了個大哈欠、緊皺眉頭放空，或是對著鏡頭比出 ✌️ 手勢，相簿都會悄悄為你捕捉這些真實可愛的日常瞬間。
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3.5">
              {gallery.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-[#030508] border border-slate-800 hover:border-cyan-500/50 rounded overflow-hidden shadow transition-all flex flex-col justify-between"
                >
                  {/* Snapshot Preview */}
                  <div
                    className="relative aspect-[4/3] sm:aspect-video bg-black overflow-hidden cursor-pointer"
                    onClick={() => setSelectedImage(item)}
                  >
                    <img
                      src={item.image}
                      alt={item.tag}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[8px] font-bold text-cyan-300 border border-slate-700 backdrop-blur-xs">
                      {item.time}
                    </div>
                    {item.type === 'peace' && (
                      <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-emerald-950/90 text-[8px] font-bold text-emerald-300 border border-emerald-500/50 backdrop-blur-xs shadow-sm">
                        ✌️ 隱藏彩蛋
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold px-2 py-1 rounded bg-black/80 border border-cyan-400/50 shadow-md">
                        點擊放大點閱
                      </span>
                    </div>
                  </div>

                  {/* Card Info Footer */}
                  <div className="p-2 sm:p-2.5 bg-[#06080e] border-t border-slate-800">
                    <div className="text-[10px] sm:text-[11px] font-bold text-slate-300 truncate mb-1.5" title={item.tag}>
                      {item.tag}
                    </div>

                    <div className="flex items-center justify-between gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDownload(item)}
                        className="flex-1 py-1 px-2 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-[9px] sm:text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer active:scale-95"
                      >
                        <Download className="w-3 h-3" />
                        <span>下載照片</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteSnapshot(item.id)}
                        className="py-1 px-2.5 rounded bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 text-rose-400 text-[9px] sm:text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer active:scale-95"
                        title="刪除單張存證"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Bottom Bar */}
        <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-[#030508] border-t border-slate-800 flex items-center justify-between text-[9px] sm:text-[10px] text-slate-500 shrink-0 gap-2">
          <div className="flex items-center gap-1.5 text-slate-400 min-w-0">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">本地端隱私保護 (100% Client-Side Privacy)</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 font-mono">
            <div className="text-[9px] sm:text-[10px] text-slate-400 hidden sm:flex items-center gap-1">
              <kbd className="px-1.5 py-0.2 rounded bg-slate-850 text-slate-300 border border-slate-700 text-[9px]">ESC</kbd>
              <span>退出</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal for enlarged view */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 animate-fade-in font-mono"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[calc(100dvh-2rem)] bg-[#06080e] border border-cyan-500/50 rounded-lg overflow-hidden shadow-2xl p-2.5 sm:p-3 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-mono text-cyan-300 shrink-0 gap-2">
              <span className="font-bold truncate">{selectedImage.tag} ({selectedImage.time})</span>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="p-1 rounded bg-slate-850 hover:bg-slate-750 border border-slate-700 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
                title="關閉"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="relative flex-1 min-h-0 w-full rounded overflow-hidden border border-slate-800 bg-black flex items-center justify-center p-1">
              <img
                src={selectedImage.image}
                alt={selectedImage.tag}
                className="max-w-full max-h-[60vh] sm:max-h-[70vh] w-auto h-auto object-contain"
              />
            </div>
            <div className="mt-2 pt-1 flex justify-between items-center gap-2 shrink-0">
              <div className="text-[9px] sm:text-[10px] text-slate-500 font-mono truncate">
                點擊背景或右上角關閉
              </div>
              <button
                type="button"
                onClick={() => handleDownload(selectedImage)}
                className="px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>下載高清原圖</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

