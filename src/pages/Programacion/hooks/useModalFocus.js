import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
].join(",");

export default function useModalFocus({ isActive = true, onClose }) {
    const dialogRef = useRef(null);
    const closeRef = useRef(onClose);
    closeRef.current = onClose;

    useEffect(() => {
        if (!isActive) return undefined;

        const dialog = dialogRef.current;
        const previousFocus = document.activeElement;
        const initialFocus = dialog?.querySelector("[data-autofocus]")
            || dialog?.querySelector(FOCUSABLE_SELECTOR)
            || dialog;
        const animationFrame = requestAnimationFrame(() => initialFocus?.focus());

        function handleKeyDown(event) {
            if (event.key === "Escape") {
                event.preventDefault();
                closeRef.current();
                return;
            }

            if (event.key !== "Tab" || !dialog) return;
            const focusableElements = [...dialog.querySelectorAll(FOCUSABLE_SELECTOR)]
                .filter(element => element.getClientRects().length > 0);

            if (focusableElements.length === 0) {
                event.preventDefault();
                dialog.focus();
                return;
            }

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            } else if (!dialog.contains(document.activeElement)) {
                event.preventDefault();
                firstElement.focus();
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            cancelAnimationFrame(animationFrame);
            document.removeEventListener("keydown", handleKeyDown);
            if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
        };
    }, [isActive]);

    return dialogRef;
}
