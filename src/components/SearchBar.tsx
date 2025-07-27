import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ListFilter } from '@/lib/icons';

interface SearchBarProps {
  onFilter?: () => void;
}

export function SearchBar({ onFilter }: SearchBarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search products..."
          className="pl-10 w-full"
          aria-label="Search products"
        />
      </div>
      <Button variant="outline" size="icon" onClick={onFilter} aria-label="Filter products">
        <ListFilter className="h-5 w-5" />
      </Button>
    </div>
  );
}
