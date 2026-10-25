'use client';
import { useEffect, useRef } from 'react';
import { IoMdClose } from 'react-icons/io';

// Live chat panel for the DJ (go-live, testing) and callers.
//
// The message list used to be react-scroll-to-bottom, which relies on
// defaultProps; React 19 ignores those, so its scroller threw
// ("scroller is not a function") and the chat stopped following new
// messages. This is a plain list that scrolls itself: it sticks to the
// bottom while the reader is at the bottom and stays put while they are
// reading older messages.
export default function ChatBox({ open, onClose, children, setName, name, message, setMessage, handleSendMessage }) {
    const listRef = useRef(null);
    const stickToBottomRef = useRef(true);
    const inputRef = useRef(null);

    const onScroll = () => {
        const el = listRef.current;
        if (!el) return;
        stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    };

    // New message (children changed): follow the bottom only while the reader
    // is already there. Someone scrolled up reading older messages stays put.
    useEffect(() => {
        const el = listRef.current;
        if (!el) return;
        if (stickToBottomRef.current) el.scrollTop = el.scrollHeight;
    }, [children]);

    // Just opened: start at the newest message with the input focused.
    useEffect(() => {
        if (!open) return;
        stickToBottomRef.current = true;
        const el = listRef.current;
        if (el) el.scrollTop = el.scrollHeight;
        const t = setTimeout(() => inputRef.current?.focus(), 50);
        return () => clearTimeout(t);
    }, [open]);

    const send = () => {
        if (!message || !String(message).trim()) return;
        handleSendMessage();
        stickToBottomRef.current = true;
    };

    const onKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
        if (e.key === 'Escape') onClose?.();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-start sm:items-center justify-center p-2 sm:p-6" onClick={onClose}>
            <div
                className="w-full max-w-[40rem] bg-white shadow-xl rounded-md flex flex-col"
                style={{ height: 'min(36rem, calc(100dvh - 1rem))' }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-label="Live chat"
            >
                <div className="flex justify-between items-center gap-3 px-4 py-3 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Live Chat</h3>
                    {
                        setName &&
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="flex-1 max-w-[14rem] outline-none border-2 border-gray-300 hover:border-indigo-500 focus:border-indigo-500 rounded-md px-2 py-1 text-sm"
                            placeholder="Your name"
                            id="chat-name"
                            name="chat-name"
                        />
                    }
                    <button className="bg-none outline-none border-none text-gray-700 hover:text-black" onClick={onClose} aria-label="Close chat">
                        <IoMdClose size={28} />
                    </button>
                </div>

                <div ref={listRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-2 py-3 bg-gray-50">
                    {
                        (!children || (Array.isArray(children) && children.length === 0)) &&
                        <p className="text-center text-sm text-gray-400 mt-10">No messages yet. Listeners' messages appear here.</p>
                    }
                    {children}
                </div>

                <div className="flex gap-2 items-center p-3 border-t border-gray-200">
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 outline-none border-2 border-gray-300 hover:border-indigo-500 focus:border-indigo-500 rounded-md px-3 py-2"
                        placeholder="Type a message and press Enter"
                        id="chat-message"
                        name="chat-message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={onKeyDown}
                        maxLength={500}
                    />
                    <button
                        onClick={send}
                        disabled={!message || !String(message).trim()}
                        className="bg-indigo-500 hover:bg-indigo-600 border-none py-2 px-4 rounded-md outline-none text-white disabled:cursor-not-allowed disabled:bg-indigo-200 disabled:text-gray-100"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
