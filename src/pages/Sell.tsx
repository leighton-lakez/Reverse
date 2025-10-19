import { useState } from "react";
import { ArrowLeft, Upload, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const Sell = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState<string[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map((file) => URL.createObjectURL(file));
      setImages([...images, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.success("Item listed successfully!");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-2">
          <h1 className="text-xl font-bold text-foreground">List Item</h1>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-4 py-3">
        <form onSubmit={handleSubmit} className="space-y-3 animate-fade-in">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Photos</Label>
            <div className="grid grid-cols-4 gap-2">
              {images.map((image, index) => (
                <div key={index} className="relative aspect-square rounded-md overflow-hidden group">
                  <img src={image} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              
              <label className="aspect-square rounded-md border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 bg-muted/50 hover:bg-muted">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Add</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="title" className="text-sm font-semibold">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Gucci Leather Handbag"
              required
              className="bg-muted border-border h-9"
            />
          </div>

          {/* Brand & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="brand" className="text-sm font-semibold">Brand *</Label>
              <Input
                id="brand"
                placeholder="e.g., Gucci"
                required
                className="bg-muted border-border h-9"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="category" className="text-sm font-semibold">Category *</Label>
              <Select required>
                <SelectTrigger className="bg-muted border-border h-9">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="handbags">Handbags</SelectItem>
                  <SelectItem value="shoes">Shoes</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                  <SelectItem value="jewelry">Jewelry</SelectItem>
                  <SelectItem value="watches">Watches</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="description" className="text-sm font-semibold">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe condition, authenticity, flaws..."
              rows={3}
              required
              className="bg-muted border-border resize-none text-sm"
            />
          </div>

          {/* Condition & Price */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="condition" className="text-sm font-semibold">Condition *</Label>
              <Select required>
                <SelectTrigger className="bg-muted border-border h-9">
                  <SelectValue placeholder="Condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New with Tags</SelectItem>
                <SelectItem value="like-new">Like New</SelectItem>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="price" className="text-sm font-semibold">Price *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">
                  $
                </span>
                <Input
                  id="price"
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                  className="pl-7 bg-muted border-border h-9"
                />
              </div>
            </div>
          </div>

          {/* Location & Size */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="location" className="text-sm font-semibold">Location *</Label>
              <Input
                id="location"
                placeholder="City, State"
                required
                className="bg-muted border-border h-9"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="size" className="text-sm font-semibold">Size</Label>
              <Input
                id="size"
                placeholder="M, 8, 32"
                className="bg-muted border-border h-9"
              />
            </div>
          </div>

          {/* Trade Option */}
          <div className="space-y-1">
            <Label htmlFor="trade" className="text-sm font-semibold">Open to Trades?</Label>
            <Select defaultValue="yes">
              <SelectTrigger className="bg-muted border-border h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              className="w-full h-10 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              List Item
            </Button>
          </div>
        </form>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Sell;
