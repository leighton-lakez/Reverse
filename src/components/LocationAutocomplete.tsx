import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const US_CITIES = [
  "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ",
  "Philadelphia, PA", "San Antonio, TX", "San Diego, CA", "Dallas, TX", "San Jose, CA",
  "Austin, TX", "Jacksonville, FL", "Fort Worth, TX", "Columbus, OH", "Charlotte, NC",
  "San Francisco, CA", "Indianapolis, IN", "Seattle, WA", "Denver, CO", "Washington, DC",
  "Boston, MA", "El Paso, TX", "Nashville, TN", "Detroit, MI", "Oklahoma City, OK",
  "Portland, OR", "Las Vegas, NV", "Memphis, TN", "Louisville, KY", "Baltimore, MD",
  "Milwaukee, WI", "Albuquerque, NM", "Tucson, AZ", "Fresno, CA", "Mesa, AZ",
  "Sacramento, CA", "Atlanta, GA", "Kansas City, MO", "Colorado Springs, CO", "Omaha, NE",
  "Raleigh, NC", "Miami, FL", "Long Beach, CA", "Virginia Beach, VA", "Oakland, CA",
  "Minneapolis, MN", "Tulsa, OK", "Tampa, FL", "Arlington, TX", "New Orleans, LA"
];

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = "Enter city and state",
  className,
  required
}: LocationAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const filteredCities = US_CITIES.filter(city =>
    city.toLowerCase().includes(inputValue.toLowerCase())
  ).slice(0, 10);

  const handleSelect = (city: string) => {
    setInputValue(city);
    onChange(city);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              onChange(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className={className}
            required={required}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 z-50 bg-popover" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>No cities found.</CommandEmpty>
            <CommandGroup>
              {filteredCities.map((city) => (
                <CommandItem
                  key={city}
                  value={city}
                  onSelect={() => handleSelect(city)}
                  className="cursor-pointer"
                >
                  {city}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
