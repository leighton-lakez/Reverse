import { useState, useEffect, useRef } from "react";
import { Upload, X, Send, Loader2, Video, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { getUserFriendlyError } from "@/lib/errorHandler";
import { itemSchema } from "@/lib/validationSchemas";
import { ReverseIcon } from "@/components/ReverseIcon";
import OpenAI from "openai";

type Message = {
  id: string;
  type: "bot" | "user";
  content: string;
  options?: string[];
  inputType?: "text" | "number" | "image" | "select";
  timestamp: Date;
};

type ItemData = {
  title: string;
  brand: string;
  category: string;
  description: string;
  condition: string;
  price: string;
  location: string;
  size: string;
  tradePreference: string;
  images: File[];
  videos: File[];
};

const conversationSteps = [
  "welcome",
  "images",
  "title",
  "brand",
  "category",
  "description",
  "condition",
  "price",
  "location",
  "size",
  "trade",
  "summary",
] as const;

type ConversationStep = (typeof conversationSteps)[number];

const Sell = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState<ConversationStep>("welcome");
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isGettingAIPrice, setIsGettingAIPrice] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [itemData, setItemData] = useState<ItemData>({
    title: "",
    brand: "",
    category: "",
    description: "",
    condition: "",
    price: "",
    location: "",
    size: "",
    tradePreference: "",
    images: [],
    videos: [],
  });

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast({
          title: "Sign in required",
          description: "Please sign in to list items for sale",
        });
        navigate("/auth");
      } else {
        setUserId(session.user.id);
        startConversation();
      }
    });
  }, [navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addMessage = (content: string, type: "bot" | "user", options?: string[], inputType?: Message["inputType"]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      options,
      inputType,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const addBotMessageWithDelay = (content: string, delay: number = 600, options?: string[], inputType?: Message["inputType"]) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMessage(content, "bot", options, inputType);
    }, delay);
  };

  const getAIPriceSuggestion = async () => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey || apiKey === "your-openai-api-key-here") {
      toast({
        title: "AI Feature Not Available",
        description: "OpenAI API key is not configured.",
        variant: "destructive",
      });
      return;
    }

    if (itemData.images.length === 0) {
      toast({
        title: "Image Required",
        description: "Please upload at least one image first to use AI price suggestion.",
        variant: "destructive",
      });
      return;
    }

    setIsGettingAIPrice(true);
    addMessage("I'd like AI to suggest a price for me", "user");

    try {
      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
      });

      // Convert first image to base64
      const firstImage = itemData.images[0];
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: `You are a luxury fashion resale pricing expert. Analyze the product image and any damage/condition notes to suggest a fair resale price. Consider:
- Brand value and market demand
- Item condition (visible wear, scratches, damages)
- Current resale market trends
- Authenticity indicators

Provide a specific price range and explain your reasoning. Be concise but thorough.`,
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `Product Details:
Title: ${itemData.title || "Not provided"}
Brand: ${itemData.brand || "Not provided"}
Category: ${itemData.category || "Not provided"}
Condition: ${itemData.condition || "Not provided"}
Description: ${itemData.description || "Please analyze the image and suggest a fair resale price based on visible condition."}

Please provide a price suggestion considering any visible damage or wear in the image.`,
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: base64Image,
                      detail: "high",
                    },
                  },
                ],
              },
            ],
            max_tokens: 500,
            temperature: 0.7,
          });

          const aiSuggestion = response.choices[0]?.message?.content || "Unable to generate price suggestion.";

          addBotMessageWithDelay(
            `🤖 AI Price Analysis:\n\n${aiSuggestion}\n\nWould you like to use this suggestion, or enter your own price?`,
            800
          );
        } catch (error: any) {
          console.error("OpenAI API Error:", error);
          toast({
            title: "AI Analysis Failed",
            description: error.message || "Failed to get price suggestion. Please try again.",
            variant: "destructive",
          });
          addBotMessageWithDelay("I had trouble analyzing the price. Please enter your price manually.", 600);
        } finally {
          setIsGettingAIPrice(false);
        }
      };

      reader.readAsDataURL(firstImage);
    } catch (error: any) {
      setIsGettingAIPrice(false);
      toast({
        title: "Error",
        description: error.message || "Failed to analyze price.",
        variant: "destructive",
      });
      addBotMessageWithDelay("I had trouble with that. Please enter your price manually.", 600);
    }
  };

  const startConversation = () => {
    // Set to images step immediately so upload button appears right away
    setCurrentStep("images");

    addBotMessageWithDelay(
      "Hey there! 👋 I'm here to help you list your item. This will only take a minute. Ready to get started?",
      300
    );
    setTimeout(() => {
      addBotMessageWithDelay("First up, let's add some photos or videos of your item. You can upload multiple files. Click the upload button below! 📸🎥", 1000);
    }, 1000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);

      // Separate images and videos
      const newImages = newFiles.filter(file => file.type.startsWith('image/'));
      const newVideos = newFiles.filter(file => file.type.startsWith('video/'));

      // Check video file size (max 50MB per video)
      const oversizedVideos = newVideos.filter(video => video.size > 50 * 1024 * 1024);
      if (oversizedVideos.length > 0) {
        toast({
          title: "Video too large",
          description: "Videos must be under 50MB each",
          variant: "destructive",
        });
        return;
      }

      // Create previews
      const newImagePreviews = newImages.map((file) => URL.createObjectURL(file));
      const newVideoPreviews = newVideos.map((file) => URL.createObjectURL(file));

      const updatedImages = [...itemData.images, ...newImages];
      const updatedVideos = [...itemData.videos, ...newVideos];
      const updatedImagePreviews = [...imagePreviews, ...newImagePreviews];
      const updatedVideoPreviews = [...videoPreviews, ...newVideoPreviews];

      setItemData({ ...itemData, images: updatedImages, videos: updatedVideos });
      setImagePreviews(updatedImagePreviews);
      setVideoPreviews(updatedVideoPreviews);

      const totalFiles = updatedImages.length + updatedVideos.length;
      addMessage(`Added ${newImages.length} photo(s) and ${newVideos.length} video(s)`, "user");

      if (totalFiles > 0) {
        addBotMessageWithDelay(
          `Great! I've got ${updatedImages.length} photo(s) and ${updatedVideos.length} video(s). You can add more or we can move on. What's the title of your item?`,
          800
        );
        setCurrentStep("title");
      }
    }
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setItemData({
      ...itemData,
      images: itemData.images.filter((_, i) => i !== index),
    });
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    URL.revokeObjectURL(videoPreviews[index]);
    setItemData({
      ...itemData,
      videos: itemData.videos.filter((_, i) => i !== index),
    });
    setVideoPreviews(videoPreviews.filter((_, i) => i !== index));
  };

  const handleSubmitInput = (value?: string) => {
    const inputToSubmit = value || inputValue.trim();
    if (!inputToSubmit && currentStep !== "images") return;

    addMessage(inputToSubmit, "user");
    setInputValue("");

    switch (currentStep) {
      case "title":
        setItemData({ ...itemData, title: inputToSubmit });
        addBotMessageWithDelay("Perfect! What brand is it?", 600);
        setCurrentStep("brand");
        break;

      case "brand":
        setItemData({ ...itemData, brand: inputToSubmit });
        addBotMessageWithDelay(
          "Got it! What category does this item belong to?",
          600,
          ["Handbags", "Shoes", "Clothing", "Accessories", "Jewelry", "Watches"],
          "select"
        );
        setCurrentStep("category");
        break;

      case "category":
        setItemData({ ...itemData, category: inputToSubmit.toLowerCase() });
        addBotMessageWithDelay(
          "Nice! Can you describe the item? Include details about authenticity, flaws, or anything special about it.",
          600
        );
        setCurrentStep("description");
        break;

      case "description":
        setItemData({ ...itemData, description: inputToSubmit });
        addBotMessageWithDelay(
          "Thanks! What condition is the item in?",
          600,
          ["New with Tags", "Like New", "Excellent", "Good", "Fair"],
          "select"
        );
        setCurrentStep("condition");
        break;

      case "condition":
        const conditionMap: Record<string, string> = {
          "New with Tags": "new",
          "Like New": "like-new",
          "Excellent": "excellent",
          "Good": "good",
          "Fair": "fair",
        };
        setItemData({ ...itemData, condition: conditionMap[inputToSubmit] || inputToSubmit });
        addBotMessageWithDelay("What price are you asking for it? (just the number, like 150)\n\n💡 Not sure? I can analyze your photos with AI to suggest a fair price!", 600);
        setCurrentStep("price");
        break;

      case "price":
        setItemData({ ...itemData, price: inputToSubmit });
        addBotMessageWithDelay("Where are you located? (City, State)", 600);
        setCurrentStep("location");
        break;

      case "location":
        setItemData({ ...itemData, location: inputToSubmit });
        addBotMessageWithDelay("What size is the item? (e.g., M, 8, 32, or type 'N/A' if not applicable)", 600);
        setCurrentStep("size");
        break;

      case "size":
        setItemData({ ...itemData, size: inputToSubmit });
        addBotMessageWithDelay(
          "Last question! Are you open to trades?",
          600,
          ["Yes", "No"],
          "select"
        );
        setCurrentStep("trade");
        break;

      case "trade":
        setItemData({ ...itemData, tradePreference: inputToSubmit.toLowerCase() });
        showSummary(inputToSubmit);
        break;
    }
  };

  const showSummary = (tradeAnswer: string) => {
    const data = { ...itemData, tradePreference: tradeAnswer.toLowerCase() };

    addBotMessageWithDelay("Perfect! Here's what we've got:", 600);

    setTimeout(() => {
      const summary = `
📦 **${data.title}**
🏷️ Brand: ${data.brand}
📂 Category: ${data.category.charAt(0).toUpperCase() + data.category.slice(1)}
📝 Description: ${data.description}
✨ Condition: ${data.condition}
💰 Price: $${data.price}
📍 Location: ${data.location}
📏 Size: ${data.size}
🔄 Open to trades: ${data.tradePreference}
📸 ${data.images.length} photo(s)${data.videos.length > 0 ? ` and ${data.videos.length} video(s)` : ''}
      `.trim();

      addMessage(summary, "bot");

      setTimeout(() => {
        addBotMessageWithDelay(
          "Does everything look good? Click 'List Item' to publish or 'Start Over' to restart.",
          1200,
          ["List Item", "Start Over"],
          "select"
        );
        setCurrentStep("summary");
      }, 800);
    }, 1200);
  };

  const handleOptionClick = (option: string) => {
    if (currentStep === "summary") {
      if (option === "List Item") {
        submitListing();
      } else {
        resetConversation();
      }
    } else {
      handleSubmitInput(option);
    }
  };

  const resetConversation = () => {
    // Clear images and videos
    imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
    videoPreviews.forEach(preview => URL.revokeObjectURL(preview));
    setImagePreviews([]);
    setVideoPreviews([]);

    // Reset state
    setMessages([]);
    setItemData({
      title: "",
      brand: "",
      category: "",
      description: "",
      condition: "",
      price: "",
      location: "",
      size: "",
      tradePreference: "",
      images: [],
      videos: [],
    });
    setCurrentStep("welcome");

    // Restart
    startConversation();
  };

  const submitListing = async () => {
    if (!userId) return;

    setSubmitting(true);
    addMessage("List Item", "user");
    addBotMessageWithDelay("Great! Let me create your listing... 🚀", 300);

    try {
      // Check if at least one image or video is uploaded
      if (itemData.images.length === 0 && itemData.videos.length === 0) {
        throw new Error('Please upload at least one photo or video');
      }

      // Validate - handle empty strings for optional fields
      const validationResult = itemSchema.safeParse({
        title: itemData.title,
        brand: itemData.brand || '',
        category: itemData.category,
        description: itemData.description,
        condition: itemData.condition,
        price: parseFloat(itemData.price),
        location: itemData.location,
        size: itemData.size || '',
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        console.error('Validation errors:', validationResult.error.errors);
        throw new Error(firstError.message);
      }

      // Upload images
      const uploadedImageUrls: string[] = [];
      for (const file of itemData.images) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("item-images")
          .upload(fileName, file);

        if (uploadError) {
          console.error('Image upload error:', uploadError);
          throw new Error(`Failed to upload images: ${uploadError.message}`);
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("item-images").getPublicUrl(uploadData.path);

        uploadedImageUrls.push(publicUrl);
      }

      // Upload videos
      const uploadedVideoUrls: string[] = [];
      for (const file of itemData.videos) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("item-images")
          .upload(fileName, file);

        if (uploadError) {
          console.error('Video upload error:', uploadError);
          throw new Error(`Failed to upload videos: ${uploadError.message}`);
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("item-images").getPublicUrl(uploadData.path);

        uploadedVideoUrls.push(publicUrl);
      }

      // Insert item
      const { error, data: insertedData } = await supabase.from("items").insert({
        user_id: userId,
        title: validationResult.data.title,
        brand: validationResult.data.brand || null,
        category: validationResult.data.category,
        description: validationResult.data.description,
        condition: validationResult.data.condition,
        price: validationResult.data.price,
        location: validationResult.data.location,
        size: validationResult.data.size || null,
        trade_preference: itemData.tradePreference,
        images: uploadedImageUrls,
        videos: uploadedVideoUrls,
        status: 'available',
      });

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      setTimeout(() => {
        addMessage("Your item is now live! ✨", "bot");
        toast({
          title: "Success!",
          description: "Your item has been listed.",
        });

        setTimeout(() => {
          navigate("/");
        }, 1500);
      }, 1000);
    } catch (error: any) {
      console.error('Listing submission error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        full: error
      });

      // Show actual error in development, friendly error in production
      const errorMessage = error.message || getUserFriendlyError(error);
      const displayMessage = process.env.NODE_ENV === 'development'
        ? errorMessage
        : getUserFriendlyError(error);

      addMessage(`Oops! ${displayMessage} Please try again.`, "bot");
      toast({
        title: "Error",
        description: displayMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getCurrentInputType = (): "text" | "number" => {
    return currentStep === "price" ? "number" : "text";
  };

  const getPlaceholder = (): string => {
    const placeholders: Record<ConversationStep, string> = {
      welcome: "",
      images: "",
      title: "e.g., Gucci Leather Handbag",
      brand: "e.g., Gucci",
      category: "",
      description: "Describe your item...",
      condition: "",
      price: "150",
      location: "Los Angeles, CA",
      size: "M, 8, 32, etc.",
      trade: "",
      summary: "",
    };
    return placeholders[currentStep];
  };

  const canSubmitInput = currentStep !== "images" && currentStep !== "summary" && currentStep !== "welcome";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-card pb-20 sm:pb-24 flex flex-col overflow-hidden relative">
      {/* Ambient gradient background */}
      <div className="fixed inset-0 gradient-mesh pointer-events-none opacity-30" />

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate("/")}>
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-lg blur-md group-hover:blur-lg transition-all" />
                <ReverseIcon className="w-9 h-9 relative z-10 group-hover:scale-105 transition-transform" />
              </div>
              <h1 className="text-2xl font-black tracking-tighter text-gradient">REVERSE</h1>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground">Live Assistant</span>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-3 sm:px-6 py-3 sm:py-4 overflow-y-auto pb-32 sm:pb-24 relative z-10">
        <div className="space-y-2 pb-4">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 shadow-lg transition-all hover:scale-[1.01] ${
                  message.type === "user"
                    ? "bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground shadow-primary/20 border border-primary/30"
                    : "glass text-foreground border border-border/50 backdrop-blur-xl"
                }`}
              >
                <p className="text-[11px] sm:text-xs whitespace-pre-line leading-snug font-medium">{message.content}</p>

                {message.options && (
                  <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-1.5 sm:mt-2">
                    {message.options.map((option) => (
                      <Button
                        key={option}
                        onClick={() => handleOptionClick(option)}
                        size="sm"
                        variant="outline"
                        className="bg-background/80 hover:bg-primary/10 border-primary/30 hover:border-primary/50 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-2.5 rounded-full font-semibold hover:shadow-md transition-all hover:scale-105"
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="glass rounded-xl px-3 py-2 shadow-lg border border-border/50 backdrop-blur-xl">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce shadow-lg shadow-primary/50" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce shadow-lg shadow-primary/50" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce shadow-lg shadow-primary/50" style={{ animationDelay: "300ms" }}></div>
                </div>
              </div>
            </div>
          )}

          {/* Image Previews */}
          {imagePreviews.length > 0 && currentStep !== "summary" && (
            <div className="flex justify-start animate-fade-in">
              <div className="glass rounded-2xl p-3 sm:p-3.5 shadow-lg border border-border/50 backdrop-blur-xl max-w-[85%] sm:max-w-[75%]">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                  <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Photos</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden group ring-1 ring-border/50 hover:ring-primary/50 transition-all">
                      <img src={preview} alt={`Upload ${index + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Video Previews */}
          {videoPreviews.length > 0 && currentStep !== "summary" && (
            <div className="flex justify-start animate-fade-in">
              <div className="glass rounded-2xl p-3 sm:p-3.5 shadow-lg border border-border/50 backdrop-blur-xl max-w-[85%] sm:max-w-[75%]">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="h-1.5 w-1.5 bg-secondary rounded-full" />
                  <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Videos</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {videoPreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden group ring-1 ring-border/50 hover:ring-secondary/50 transition-all">
                      <video src={preview} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition-colors">
                        <div className="p-2 bg-white/90 rounded-full">
                          <Video className="h-5 w-5 text-secondary" />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110"
                        onClick={() => removeVideo(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <div className="sticky bottom-0 sm:bottom-16 safe-area-bottom z-20">
        <div className="relative">
          {/* Gradient fade effect */}
          <div className="absolute bottom-full left-0 right-0 h-20 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none" />

          <div className="glass border-t border-border/50 backdrop-blur-2xl">
            <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-5">
              {currentStep === "images" && (
                <div className="flex gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 h-12 sm:h-14 text-sm sm:text-base bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all font-bold rounded-2xl border border-primary/20"
                  >
                    <Upload className="h-5 w-5 mr-2.5" />
                    Upload Photos/Videos
                  </Button>
                </div>
              )}

              {canSubmitInput && (
                <div className="space-y-3">
                  {currentStep === "price" && (
                    <Button
                      onClick={getAIPriceSuggestion}
                      disabled={isGettingAIPrice || itemData.images.length === 0}
                      className="w-full h-12 sm:h-14 bg-gradient-to-r from-secondary via-secondary to-secondary/90 hover:from-secondary/90 hover:via-secondary hover:to-secondary shadow-xl shadow-secondary/30 hover:shadow-2xl hover:shadow-secondary/40 transition-all font-bold rounded-2xl border border-secondary/20"
                    >
                      {isGettingAIPrice ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2.5 animate-spin" />
                          AI is analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 mr-2.5" />
                          Get AI Price Suggestion
                        </>
                      )}
                    </Button>
                  )}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSubmitInput();
                    }}
                    className="flex gap-3"
                  >
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={getPlaceholder()}
                      type={getCurrentInputType()}
                      className="flex-1 h-12 sm:h-14 text-sm sm:text-base bg-background/50 border-border/50 rounded-2xl px-5 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-medium placeholder:text-muted-foreground/60"
                      disabled={submitting || isGettingAIPrice}
                      autoFocus
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 transition-all"
                      disabled={!inputValue.trim() || submitting || isGettingAIPrice}
                    >
                      {submitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Sell;
