import { useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { ArrowLeft, X, DollarSign, Tag, MapPin, Package, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import LocationAutocomplete from "@/components/LocationAutocomplete";

const CATEGORIES = [
  "Clothing",
  "Shoes",
  "Accessories",
  "Bags",
  "Jewelry",
  "Watches",
  "Beauty",
  "Home",
  "Electronics",
  "Sports",
  "Books",
  "Art",
  "Other"
];

const CONDITIONS = [
  { value: "new", label: "New with Tags", description: "Never worn, original tags attached" },
  { value: "like-new", label: "Like New", description: "Worn once or twice, excellent condition" },
  { value: "excellent", label: "Excellent", description: "Gently used, no visible flaws" },
  { value: "good", label: "Good", description: "Used with minor wear" },
  { value: "fair", label: "Fair", description: "Visible wear and tear" }
];

const BRANDS = [
  "Nike", "Adidas", "Gucci", "Louis Vuitton", "Prada", "Chanel",
  "Versace", "Supreme", "Off-White", "Balenciaga", "Yeezy", "Jordan",
  "Coach", "Michael Kors", "Kate Spade", "Zara", "H&M", "Uniqlo"
];

const SIZES = {
  clothing: ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"],
  shoes: ["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12", "13", "14"]
};

const Filters = () => {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const [searchParams] = useSearchParams();
  const fromMapView = routerLocation.state?.fromMapView || false;

  // Initialize from URL params
  const [priceRange, setPriceRange] = useState<[number, number]>([
    parseInt(searchParams.get("minPrice") || "0"),
    parseInt(searchParams.get("maxPrice") || "10000")
  ]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get("categories")?.split(",").filter(Boolean) || []
  );
  const [selectedConditions, setSelectedConditions] = useState<string[]>(
    searchParams.get("conditions")?.split(",").filter(Boolean) || []
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    searchParams.get("brands")?.split(",").filter(Boolean) || []
  );
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    searchParams.get("sizes")?.split(",").filter(Boolean) || []
  );
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [customBrand, setCustomBrand] = useState("");

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleCondition = (condition: string) => {
    setSelectedConditions(prev =>
      prev.includes(condition)
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand)
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  const toggleSize = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size)
        ? prev.filter(s => s !== size)
        : [...prev, size]
    );
  };

  const addCustomBrand = () => {
    if (customBrand.trim() && !selectedBrands.includes(customBrand.trim())) {
      setSelectedBrands([...selectedBrands, customBrand.trim()]);
      setCustomBrand("");
    }
  };

  const clearAllFilters = () => {
    setPriceRange([0, 10000]);
    setSelectedCategories([]);
    setSelectedConditions([]);
    setSelectedBrands([]);
    setSelectedSizes([]);
    setLocation("");
    setSearchQuery("");
  };

  const applyFilters = () => {
    const params = new URLSearchParams();

    if (searchQuery) params.set("search", searchQuery);
    if (priceRange[0] > 0) params.set("minPrice", priceRange[0].toString());
    if (priceRange[1] < 10000) params.set("maxPrice", priceRange[1].toString());
    if (selectedCategories.length) params.set("categories", selectedCategories.join(","));
    if (selectedConditions.length) params.set("conditions", selectedConditions.join(","));
    if (selectedBrands.length) params.set("brands", selectedBrands.join(","));
    if (selectedSizes.length) params.set("sizes", selectedSizes.join(","));
    if (location) params.set("location", location);

    // Navigate back and preserve map view state if user came from map view
    navigate(`/?${params.toString()}`, {
      state: { showMapView: fromMapView }
    });
  };

  const activeFiltersCount =
    selectedCategories.length +
    selectedConditions.length +
    selectedBrands.length +
    selectedSizes.length +
    (location ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 10000 ? 1 : 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="hover:bg-muted"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Filters</h1>
                {activeFiltersCount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={clearAllFilters}
              disabled={activeFiltersCount === 0}
            >
              Clear All
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <Card className="p-4">
          <Label className="text-base font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Search
          </Label>
          <Input
            placeholder="Search for items, brands, keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-muted"
          />
        </Card>

        {/* Price Range */}
        <Card className="p-4">
          <Label className="text-base font-semibold mb-3 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Price Range
          </Label>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Min: ${priceRange[0]}</span>
              <span className="text-muted-foreground">Max: ${priceRange[1]}</span>
            </div>
            <Slider
              min={0}
              max={10000}
              step={50}
              value={priceRange}
              onValueChange={(value) => setPriceRange(value as [number, number])}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1">Min Price</Label>
                <Input
                  type="number"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                  className="bg-muted"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1">Max Price</Label>
                <Input
                  type="number"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 10000])}
                  className="bg-muted"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Location */}
        <Card className="p-4">
          <Label className="text-base font-semibold mb-3 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Location
          </Label>
          <LocationAutocomplete
            value={location}
            onChange={setLocation}
          />
        </Card>

        {/* Categories */}
        <Card className="p-4">
          <Label className="text-base font-semibold mb-3 flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            Categories
          </Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <Badge
                key={category}
                variant={selectedCategories.includes(category) ? "default" : "outline"}
                className="cursor-pointer px-4 py-2 text-sm"
                onClick={() => toggleCategory(category)}
              >
                {category}
                {selectedCategories.includes(category) && (
                  <X className="h-3 w-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>
        </Card>

        {/* Condition */}
        <Card className="p-4">
          <Label className="text-base font-semibold mb-3 flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Condition
          </Label>
          <div className="space-y-2">
            {CONDITIONS.map((condition) => (
              <Card
                key={condition.value}
                className={`p-3 cursor-pointer transition-all ${
                  selectedConditions.includes(condition.value)
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => toggleCondition(condition.value)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{condition.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{condition.description}</p>
                  </div>
                  {selectedConditions.includes(condition.value) && (
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-foreground text-xs">✓</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Brands */}
        <Card className="p-4">
          <Label className="text-base font-semibold mb-3">Popular Brands</Label>
          <div className="flex flex-wrap gap-2 mb-3">
            {BRANDS.map((brand) => (
              <Badge
                key={brand}
                variant={selectedBrands.includes(brand) ? "default" : "outline"}
                className="cursor-pointer px-4 py-2 text-sm"
                onClick={() => toggleBrand(brand)}
              >
                {brand}
                {selectedBrands.includes(brand) && (
                  <X className="h-3 w-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add custom brand..."
              value={customBrand}
              onChange={(e) => setCustomBrand(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomBrand()}
              className="bg-muted"
            />
            <Button onClick={addCustomBrand} variant="outline">Add</Button>
          </div>
          {selectedBrands.filter(b => !BRANDS.includes(b)).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Label className="w-full text-xs text-muted-foreground">Custom brands:</Label>
              {selectedBrands.filter(b => !BRANDS.includes(b)).map((brand) => (
                <Badge
                  key={brand}
                  variant="default"
                  className="cursor-pointer px-4 py-2 text-sm"
                  onClick={() => toggleBrand(brand)}
                >
                  {brand}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
        </Card>

        {/* Sizes */}
        <Card className="p-4">
          <Label className="text-base font-semibold mb-3">Clothing Sizes</Label>
          <div className="flex flex-wrap gap-2 mb-4">
            {SIZES.clothing.map((size) => (
              <Badge
                key={size}
                variant={selectedSizes.includes(size) ? "default" : "outline"}
                className="cursor-pointer px-4 py-2 text-sm w-14 justify-center"
                onClick={() => toggleSize(size)}
              >
                {size}
              </Badge>
            ))}
          </div>
          <Label className="text-base font-semibold mb-3">Shoe Sizes</Label>
          <div className="flex flex-wrap gap-2">
            {SIZES.shoes.map((size) => (
              <Badge
                key={size}
                variant={selectedSizes.includes(size) ? "default" : "outline"}
                className="cursor-pointer px-4 py-2 text-sm w-14 justify-center"
                onClick={() => toggleSize(size)}
              >
                {size}
              </Badge>
            ))}
          </div>
        </Card>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border p-4 z-50">
        <div className="max-w-4xl mx-auto flex gap-3">
          <Button
            variant="outline"
            onClick={clearAllFilters}
            className="flex-1"
            disabled={activeFiltersCount === 0}
          >
            Clear All
          </Button>
          <Button
            onClick={applyFilters}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            Show Results
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Filters;
