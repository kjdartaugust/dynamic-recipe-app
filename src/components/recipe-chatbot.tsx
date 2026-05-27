"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, ChefHat, Loader2, Refrigerator, Lock, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface FridgeItem {
  id: string;
  name: string;
  amount: number | null;
  unit: string;
  expiry_date: string | null;
}

interface RecipeChatbotProps {
  recipeContext?: string;
}

function getDaysUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null;
  const days = Math.ceil(
    (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  return days;
}

export function RecipeChatbot({ recipeContext }: RecipeChatbotProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const MAX_GUEST_MESSAGES = 3;
  const isGuest = !user;

  // Fetch fridge contents
  const fetchFridgeItems = useCallback(async () => {
    try {
      const response = await fetch("/api/fridge");
      const data = await response.json();
      if (response.ok && data.items) {
        setFridgeItems(data.items);
      }
    } catch (error) {
      console.error("Failed to fetch fridge for chatbot:", error);
    }
  }, []);

  // Fetch fridge on mount and when opened
  useEffect(() => {
    fetchFridgeItems();
    // Refresh every 2 minutes
    const interval = setInterval(fetchFridgeItems, 120000);
    return () => clearInterval(interval);
  }, [fetchFridgeItems]);

  // Generate welcome message based on fridge contents and auth status
  const getWelcomeMessage = useCallback(() => {
    if (isGuest) {
      return "Hi! I'm ZeroWaste Chef, your AI cooking assistant. I can help you find recipes, suggest substitutions, and reduce food waste. Try me out — you get 3 free questions! Sign up to unlock unlimited chats, fridge tracking, and AI recipe generation.";
    }

    if (fridgeItems.length === 0) {
      return "Hi! I'm ZeroWaste Chef. Ask me what to cook with your ingredients, or tell me what's in your fridge!";
    }

    const expiringItems = fridgeItems.filter((item) => {
      const days = getDaysUntilExpiry(item.expiry_date);
      return days !== null && days <= 3;
    });

    if (expiringItems.length > 0) {
      const itemsList = expiringItems.slice(0, 3).map((i) => i.name).join(", ");
      return `Hi! I see you have ${itemsList} expiring soon. Ask me for rescue recipes, cooking tips, or substitutions!`;
    }

    return `Hi! I can see ${fridgeItems.length} item${fridgeItems.length > 1 ? "s" : ""} in your fridge. Ask me what to cook or how to use something!`;
  }, [fridgeItems, isGuest]);

  // Set welcome message when fridge data loads
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: getWelcomeMessage(),
        },
      ]);
    }
  }, [fridgeItems, getWelcomeMessage, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatFridgeContext = (): string => {
    if (fridgeItems.length === 0) return "";
    return fridgeItems
      .map((item) => {
        const days = getDaysUntilExpiry(item.expiry_date);
        const expiryInfo = days !== null 
          ? days < 0 ? " (expired)" : days <= 2 ? ` (expires in ${days} day${days !== 1 ? "s" : ""})` : ""
          : "";
        return `- ${item.amount || ""} ${item.unit || "piece"} ${item.name}${expiryInfo}`;
      })
      .join("\n");
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();

    // Check guest message limit
    if (isGuest) {
      const userMessageCount = messages.filter((m) => m.role === "user").length;
      if (userMessageCount >= MAX_GUEST_MESSAGES) {
        setMessages((prev) => [
          ...prev,
          { role: "user", content: userMessage },
        ]);
        setInput("");
        return;
      }
    }

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }].filter(
            (m) => m.role !== "system"
          ),
          recipeContext,
          fridgeContext: formatFridgeContext(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error("Chat error:", errorMsg);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Error: ${errorMsg}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickSuggestions = [
    "What can I make with my expiring ingredients?",
    "How do I store onions to last longer?",
    "Substitute for eggs in baking?",
  ];

  const expiringCount = fridgeItems.filter((item) => {
    const days = getDaysUntilExpiry(item.expiry_date);
    return days !== null && days <= 3;
  }).length;

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all duration-300 ${
          isOpen
            ? "bg-red-500 hover:bg-red-600 text-white rotate-90"
            : "btn-gradient text-white hover:scale-110"
        }`}
        aria-label={isOpen ? "Close chat" : "Open chat"
        }
      >
        {isOpen ? <X className="h-6 w-6" /> : (
          <div className="relative">
            <MessageCircle className="h-6 w-6" />
            {expiringCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {expiringCount}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl border border-orange-100 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="gradient-bg-hero p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                <h3 className="font-semibold">ZeroWaste Chef</h3>
              </div>
              {isGuest && (
                <span className="text-[10px] font-bold px-2 py-1 bg-white/20 rounded-full text-white/90">
                  {Math.max(0, MAX_GUEST_MESSAGES - messages.filter((m) => m.role === "user").length)} left
                </span>
              )}
            </div>
            <p className="text-xs text-white/80 mt-1 flex items-center gap-1">
              <Refrigerator className="h-3 w-3" />
              {fridgeItems.length > 0 
                ? `Knows ${fridgeItems.length} item${fridgeItems.length > 1 ? "s" : ""} in your fridge`
                : "Connect your fridge for smarter suggestions"
              }
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-br-md"
                      : message.content.startsWith("⚠️")
                      ? "bg-red-50 text-red-700 rounded-bl-md border border-red-200"
                      : "bg-orange-50 text-foreground rounded-bl-md border border-orange-100"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-orange-50 rounded-2xl rounded-bl-md px-4 py-3 border border-orange-100">
                  <Loader2 className="h-4 w-4 text-orange-500 animate-spin" />
                </div>
              </div>
            )}

            {/* Quick Suggestions - hide for guests on last message or show signup prompt */}
            {messages.length <= 2 && !isLoading && (
              <div className="space-y-2 mt-4">
                {isGuest && messages.filter((m) => m.role === "user").length >= MAX_GUEST_MESSAGES - 1 ? (
                  <p className="text-xs text-orange-600 font-medium text-center">
                    This is your last free message — <Link href="/register" className="underline hover:text-orange-800 font-bold">Sign up free</Link> to continue
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground font-medium">Quick asks:</p>
                    <div className="flex flex-wrap gap-2">
                      {quickSuggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setInput(suggestion);
                          }}
                          className="text-xs px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full border border-orange-200 hover:bg-orange-100 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Guest Signup Gate */}
          {isGuest && (
            () => {
              const userMessageCount = messages.filter((m) => m.role === "user").length;
              if (userMessageCount >= MAX_GUEST_MESSAGES) {
                return (
                  <div className="p-4 border-t border-orange-100 bg-gradient-to-r from-orange-50 to-red-50">
                    <div className="text-center space-y-3">
                      <div className="flex items-center justify-center gap-2 text-orange-700">
                        <Lock className="h-5 w-5" />
                        <p className="font-semibold text-sm">Guest limit reached</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Youve asked {MAX_GUEST_MESSAGES} questions. Sign up for unlimited access to ZeroWaste Chef, your personal fridge tracker, and AI-powered recipe features.
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Link
                          href="/register"
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold btn-gradient text-white rounded-xl"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          Sign Up Free
                        </Link>
                        <Link
                          href="/login"
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-orange-700 border border-orange-300 rounded-xl hover:bg-orange-50"
                        >
                          <LogIn className="h-3.5 w-3.5" />
                          Log In
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              }
              if (userMessageCount === MAX_GUEST_MESSAGES - 1) {
                return (
                  <div className="px-4 py-2 border-t border-orange-100 bg-orange-50/50">
                    <p className="text-xs text-center text-orange-600 font-medium">
                      1 message remaining as a guest — <Link href="/register" className="underline hover:text-orange-800">Sign up free</Link> for unlimited access
                    </p>
                  </div>
                );
              }
              return null;
            }
          )()}

          {/* Input */}
          {(() => {
            const guestLimitReached = isGuest && messages.filter((m) => m.role === "user").length >= MAX_GUEST_MESSAGES;
            return (
              <div className="p-3 border-t border-orange-100 bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={guestLimitReached ? "Sign up to continue chatting..." : "Ask about cooking..."}
                    disabled={guestLimitReached}
                    className="flex-1 px-4 py-2.5 text-sm border border-orange-200 rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isLoading || !input.trim() || guestLimitReached}
                    className="p-2.5 btn-gradient text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })()}
              </div>
            );
          })()}
              </div>
            );
          })()}
              </div>
            );
          })()}
        </div>
      )}
    </>
  );
}
