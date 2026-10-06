/**
 * Picture-in-Picture & Pop-out Window Manager
 * Enables always-on-top cross-tab / cross-interface blocking window
 */

export function isDocumentPiPSupported(): boolean {
  return typeof window !== 'undefined' && 'documentPictureInPicture' in window;
}

export function copyStyles(sourceDoc: Document, targetDoc: Document) {
  targetDoc.head.innerHTML = '';
  targetDoc.title = '🚨 [OHG] 跨桌面置頂阻擋監控';

  // Copy standard style tags and stylesheets
  Array.from(sourceDoc.styleSheets).forEach((styleSheet) => {
    try {
      if (styleSheet.cssRules) {
        const newStyle = targetDoc.createElement('style');
        Array.from(styleSheet.cssRules).forEach((rule) => {
          newStyle.appendChild(targetDoc.createTextNode(rule.cssText));
        });
        targetDoc.head.appendChild(newStyle);
      }
    } catch {
      if (styleSheet.href) {
        const newLink = targetDoc.createElement('link');
        newLink.rel = 'stylesheet';
        newLink.href = styleSheet.href;
        targetDoc.head.appendChild(newLink);
      }
    }
  });

  // Copy any inline styles or font links from head
  const links = sourceDoc.querySelectorAll('link[rel="stylesheet"], link[rel="preconnect"], link[rel="stylesheet"]');
  links.forEach((link) => {
    targetDoc.head.appendChild(link.cloneNode(true));
  });

  targetDoc.body.style.margin = '0';
  targetDoc.body.style.padding = '0';
  targetDoc.body.style.backgroundColor = '#070b13';
  targetDoc.body.style.overflow = 'hidden';
}

export async function requestPiPWindow(onClose?: () => void): Promise<Window | null> {
  if (typeof window === 'undefined') return null;

  // 1. Try Document Picture-in-Picture (Chromium always-on-top window)
  if ('documentPictureInPicture' in window && window.documentPictureInPicture?.requestWindow) {
    try {
      const pipWin = await window.documentPictureInPicture.requestWindow({
        width: 380,
        height: 480,
      });

      copyStyles(document, pipWin.document);

      pipWin.addEventListener('pagehide', () => {
        onClose?.();
      });

      return pipWin;
    } catch (err) {
      console.warn('Document Picture-in-Picture failed, attempting popup fallback:', err);
    }
  }

  // 2. Fallback to standard auxiliary pop-out window
  try {
    const popup = window.open(
      '',
      'OHG_ALWAYS_ON_TOP_INTERCEPTOR',
      'width=380,height=480,left=100,top=100,menubar=no,toolbar=no,location=no,status=no,resizable=yes'
    );

    if (popup) {
      copyStyles(document, popup.document);
      popup.addEventListener('pagehide', () => {
        onClose?.();
      });
      return popup;
    }
  } catch (err) {
    console.error('Failed to open auxiliary window:', err);
  }

  return null;
}
