import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Upload, X, ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import { ReverseIcon } from "@/components/ReverseIcon";
import { supabase } from "@/integrations/supabase/client";
import OpenAI from "openai";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
  timestamp: Date;
}

const AIAssistant = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hey! I'm your AI pricing assistant powered by ChatGPT. Upload a photo of your luxury item and tell me about any damages or wear, and I'll help you find the perfect resale price based on current market trends! ✨",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast({
          title: "Sign in required",
          description: "Please sign in to use the AI assistant",
        });
        navigate("/auth");
      }
    });
  }, [navigate]);

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeProduct = async (imageData: string, description: string) => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey || apiKey === "your-openai-api-key-here") {
      throw new Error("OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.");
    }

    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true, // Note: In production, use a backend API
    });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are an expert luxury fashion resale pricing assistant. Your job is to analyze pre-owned luxury items and provide accurate pricing recommendations based on:
- Brand recognition and demand
- Item condition (scratches, wear, damages)
- Current resale market trends
- Comparable sales data
- Authentication and original packaging status

Provide specific price ranges and explain your reasoning. Be honest about condition impacts on value. Include pro tips for sellers.`,
      },
    ];

    if (imageData) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: description || "Please analyze this luxury item and suggest a resale price based on its condition.",
          },
          {
            type: "image_url",
            image_url: {
              url: imageData,
              detail: "high",
            },
          },
        ],
      });
    } else {
      messages.push({
        role: "user",
        content: description,
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using GPT-4 with vision
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || "I couldn't analyze the product. Please try again.";
  };

  const handleSend = async () => {
    if (!input.trim() && !uploadedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input || "Here's my item",
      image: uploadedImage || undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const analysis = await analyzeProduct(uploadedImage || "", input);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: analysis,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setUploadedImage(null);
    } catch (error: any) {
      console.error("AI Analysis Error:", error);

      let errorMessage = "Failed to analyze product. Please try again.";

      if (error.message?.includes("API key")) {
        errorMessage = "OpenAI API key not configured. Please add your API key to the .env file.";
      } else if (error.message?.includes("rate limit")) {
        errorMessage = "Rate limit exceeded. Please wait a moment and try again.";
      } else if (error.message?.includes("insufficient_quota")) {
        errorMessage = "OpenAI API quota exceeded. Please check your OpenAI account.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      // Remove the user message since the request failed
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <ReverseIcon className="w-7 h-7" />
              <h1 className="text-lg font-black tracking-tighter text-gradient">REVERSE</h1>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm font-semibold text-primary">AI Assistant</span>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
            >
              <Card
                className={`max-w-[85%] sm:max-w-[75%] p-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border"
                }`}
              >
                {message.image && (
                  <div className="mb-2 rounded-lg overflow-hidden">
                    <img
                      src={message.image}
                      alt="Uploaded product"
                      className="w-full h-auto max-h-64 object-cover"
                    />
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                <p
                  className={`text-xs mt-2 ${
                    message.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </Card>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <Card className="max-w-[85%] sm:max-w-[75%] p-3 bg-card border-border">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-xs text-muted-foreground">Analyzing...</span>
                </div>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <div className="fixed bottom-16 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border">
        <div className="max-w-4xl mx-auto px-4 py-3">
          {uploadedImage && (
            <div className="mb-3 relative inline-block">
              <img
                src={uploadedImage}
                alt="Upload preview"
                className="h-20 w-20 object-cover rounded-lg border-2 border-primary"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={() => setUploadedImage(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />

            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 border-primary/30 hover:bg-primary/10"
              disabled={isLoading}
            >
              <Upload className="h-5 w-5 text-primary" />
            </Button>

            <Textarea
              placeholder="Describe your item and any damages (e.g., 'Louis Vuitton bag with minor scratches on hardware')..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1 min-h-[44px] max-h-32 resize-none bg-muted border-border"
              disabled={isLoading}
            />

            <Button
              onClick={handleSend}
              disabled={(!input.trim() && !uploadedImage) || isLoading}
              className="flex-shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
              size="icon"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-2 text-center">
            Powered by ChatGPT-4 Vision • Upload photos and describe condition for accurate pricing
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default AIAssistant;
