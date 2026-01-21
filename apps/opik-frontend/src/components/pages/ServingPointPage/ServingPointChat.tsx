import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "@tanstack/react-router";
import { Send, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import api, { SERVICES_BASE_URL } from "@/api/api";
import CodeMirror from "@uiw/react-codemirror";
import { jsonLanguage } from "@codemirror/lang-json";
import { useCodemirrorTheme } from "@/hooks/useCodemirrorTheme";
import { EditorView } from "@codemirror/view";
import axios from "axios";
import { useServingPointsList } from "@/api/serving-points/useServingPointsList";
import { v4 as uuidv4 } from "uuid";

interface Message {
    role: "user" | "assistant" | "system";
    content: string;
}

interface ChatCompletionRequest {
    model: string;
    messages: Message[];
}

interface ChatCompletionResponse {
    choices: {
        message: Message;
    }[];
}

const ServingPointChat: React.FC = () => {
    const { serviceName } = useParams({ strict: false });
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [threadId] = useState(() => uuidv4());
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const theme = useCodemirrorTheme({ editable: false });

    const { data: servingPoints } = useServingPointsList({ enabled: !!serviceName });
    const servingPoint = servingPoints?.find((sp) => sp.name === serviceName);

    const { mutate: sendMessage, isPending } = useMutation({
        mutationFn: async (msgs: Message[]) => {
            if (!servingPoint?.url) {
                throw new Error("Serving point URL not found");
            }

            const baseUrl = servingPoint.url.replace(/\/+$/, "");
            const targetUrl = `${baseUrl}/v1/chat/completions`;

            // Use direct axios call to avoid attaching backend-specific interceptors/auth
            const { data } = await axios.post<ChatCompletionResponse>(
                targetUrl,
                {
                    model: serviceName, // Some providers might ignore this or require specific model name
                    messages: msgs,
                    opik_args: { trace: { thread_id: threadId } },
                } as ChatCompletionRequest
            );
            return data;
        },
        onSuccess: (data) => {
            const assistantMessage = data.choices[0]?.message;
            if (assistantMessage) {
                setMessages((prev) => [...prev, assistantMessage]);
            }
        },
        onError: (error) => {
            console.error("Failed to send message", error);
            // Optionally add an error message to the chat
        },
    });

    const handleSubmit = () => {
        if (!input.trim()) return;

        let content = input;
        let isJson = false;
        try {
            const parsed = JSON.parse(input);
            content = JSON.stringify(parsed); // Ensure it's stringified JSON if valid
            isJson = true;
        } catch (e) {
            // Not JSON, use as text
        }

        const newMessage: Message = { role: "user", content: content };
        const newMessages = [...messages, newMessage];

        setMessages(newMessages);
        setInput("");
        sendMessage(newMessages);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isPending]);

    const isJsonString = (str: string) => {
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    };

    const renderMessageContent = (content: string) => {
        if (isJsonString(content)) {
            return (
                <div className="overflow-hidden rounded-md border text-sm">
                    <CodeMirror
                        value={JSON.stringify(JSON.parse(content), null, 2)}
                        theme={theme}
                        extensions={[jsonLanguage, EditorView.lineWrapping]}
                        basicSetup={{ lineNumbers: false, foldGutter: true }}
                        editable={false}
                    />
                </div>
            );
        }
        return <div className="whitespace-pre-wrap">{content}</div>;
    };

    return (
        <div className="flex flex-col h-full border-r">
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "flex w-full",
                            msg.role === "user" ? "justify-end" : "justify-start"
                        )}
                    >
                        <div
                            className={cn(
                                "max-w-[85%] rounded-lg p-3",
                                msg.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-foreground"
                            )}
                        >
                            <div className="text-xs font-semibold mb-1 opacity-70 uppercase">{msg.role}</div>
                            {renderMessageContent(msg.content)}
                        </div>
                    </div>
                ))}
                {isPending && (
                    <div className="flex justify-start">
                        <div className="bg-muted text-foreground max-w-[85%] rounded-lg p-3 flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Generating...</span>
                        </div>
                    </div>
                )}
            </div>
            <div className="p-4 border-t bg-background">
                <div className="relative">
                    <Textarea
                        ref={textareaRef}
                        key={isPending ? "loading" : "idle"} // Reset height on state change if needed? No.
                        placeholder="Type a message (Text or JSON)..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="min-h-[80px] pr-12 resize-none"
                        disabled={isPending}
                    />
                    <Button
                        size="icon"
                        className="absolute bottom-3 right-3"
                        onClick={handleSubmit}
                        disabled={!input.trim() || isPending}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ServingPointChat;
