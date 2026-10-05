import { useEffect } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

export function useModalAccessibility(ref, isOpen, onClose) {
  useEffect(() => {
    if (!isOpen || !ref.current) return undefined;

    const modal = ref.current;
    const previousFocus = document.activeElement;
    const focusable = () => [...modal.querySelectorAll(FOCUSABLE)];
    (focusable()[0] || modal).focus();

    const onKeyDown = event => {
      if (document.querySelector('dialog[open]')) return;
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const items = focusable();
      if (!items.length) {
        event.preventDefault();
        modal.focus();
      } else if (event.shiftKey && document.activeElement === items[0]) {
        event.preventDefault();
        items[items.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === items[items.length - 1]) {
        event.preventDefault();
        items[0].focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [isOpen, onClose, ref]);
}
