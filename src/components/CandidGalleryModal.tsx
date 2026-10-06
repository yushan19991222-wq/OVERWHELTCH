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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in font-mono">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#06080e] border border-slate-800 rounded-lg shadow-2xl flex flex-col overflow-hidden cctv-brackets">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#030508] border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-rose-950/80 border border-rose-500/60 text-rose-400">
              <Camera className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-100">
                <span>[OVERWATCH // 崩壞醜照藝廊]</span>
                <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px]">
                  共 {gallery.length} 張存證
                </span>
              </div>
              <div className="text-[10px] text-slate-500">
                WASM AI 智慧即時抓拍 • 工位野生表情存證檔案庫
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {gallery.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleDownloadAll}
                  className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-200 text-[10px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
                  title="一次打包下載全輯醜照"
                >
                  <Download className="w-3 h-3 text-cyan-400" />
                  <span>一鍵下載全部 ({gallery.length})</span>
                </button>
                <button
                  type="button"
                  onClick={onClearGallery}
                  className="px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 text-rose-300 text-[10px] flex items-center gap-1 transition cursor-pointer"
                  title="清空今日抓拍記錄"
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="hidden sm:inline">清空全輯</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 sm:p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition cursor-pointer flex items-center justify-center"
              title="關閉"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Gallery Content Area */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {gallery.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center text-slate-500">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-3">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-400 mb-1">今日尚無抓拍存證照片</p>
              <p className="text-[10px] text-slate-600 max-w-sm">
                當你打哈欠、眉頭緊鎖、打瞌睡或進行 AI 顏值掃描時，系統會自動拍攝野生表情並在此留存。
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {gallery.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-[#030508] border border-slate-800 hover:border-cyan-500/50 rounded overflow-hidden shadow transition-all flex flex-col justify-between"
                >
                  {/* Snapshot Preview */}
                  <div
                    className="relative aspect-video bg-black overflow-hidden cursor-pointer"
                    onClick={() => setSelectedImage(item)}
                  >
                    <img
                      src={item.image}
                      alt={item.tag}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[8px] font-bold text-cyan-300 border border-slate-700">
                      {item.time}
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold px-2 py-1 rounded bg-black/80 border border-cyan-400/50">
                        點擊放大點閱
                      </span>
                    </div>
                  </div>

                  {/* Card Info Footer */}
                  <div className="p-2.5 bg-[#06080e] border-t border-slate-800">
                    <div className="text-[10px] font-bold text-slate-300 truncate mb-2" title={item.tag}>
                      {item.tag}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownload(item)}
                        className="flex-1 py-1 px-2 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-[9px] font-bold flex items-center justify-center gap-1 transition cursor-pointer active:scale-95"
                      >
                        <Download className="w-3 h-3" />
                        <span>下載照片</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteSnapshot(item.id)}
                        className="py-1 px-2 rounded bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 text-rose-400 text-[9px] font-bold flex items-center justify-center gap-1 transition cursor-pointer active:scale-95"
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
        <div className="px-4 py-2.5 bg-[#030508] border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>所有照片僅儲存於本地端 (100% Client-Side Privacy)</span>
          </div>
          <div className="flex items-center gap-2">
            {gallery.length > 0 && (
              <button
                type="button"
                onClick={handleDownloadAll}
                className="px-3 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition cursor-pointer flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                <span>一鍵全部下載 ({gallery.length})</span>
              </button>
            )}
            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-850 text-slate-300 border border-slate-700">ESC</kbd>
              <span>退出藝廊</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal for enlarged view */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-[#06080e] border border-cyan-500/50 rounded-lg overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-2 border-b border-slate-800 text-xs font-mono text-cyan-300 mb-2">
              <span className="font-bold">{selectedImage.tag} ({selectedImage.time})</span>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="p-1 rounded bg-slate-850 hover:bg-slate-750 border border-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                title="關閉"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="relative aspect-video w-full rounded overflow-hidden border border-slate-800 bg-black">
              <img
                src={selectedImage.image}
                alt={selectedImage.tag}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="mt-2 flex justify-between items-center">
              <div className="text-[10px] text-slate-500 font-mono">
                點擊背景或右上角關閉
              </div>
              <button
                type="button"
                onClick={() => handleDownload(selectedImage)}
                className="px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
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

