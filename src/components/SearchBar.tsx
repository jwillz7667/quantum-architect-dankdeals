import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFilter?: () => void;
}

export function SearchBar({ value, onChange, onFilter }: SearchBarProps) {
  return (
    <div className="search-bar">
      <Search className="h-5 w-5 text-muted-foreground" />
      <Input
        placeholder="I'm willing to find..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={onFilter}
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
      >
        <SlidersHorizontal className="h-4 w-4" />
      </Button>
    </div>
  );
}