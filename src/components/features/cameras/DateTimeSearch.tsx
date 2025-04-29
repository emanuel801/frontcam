"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Search, Clock, Loader2 } from 'lucide-react'; // Added Clock icon, Loader2
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast"; // Import useToast

interface DateTimeSearchProps extends React.HTMLAttributes<HTMLDivElement> { // Extend props to allow className
  onSearch: (date: Date, time: string) => void;
  isLoading: boolean;
}

const DateTimeSearch: React.FC<DateTimeSearchProps> = ({ onSearch, isLoading, className, ...props }) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>(format(new Date(), 'HH:mm')); // Default to current time
  const { toast } = useToast();

  const handleSearchClick = () => {
    if (date) {
      onSearch(date, time);
    } else {
        toast({
          title: "Missing Date",
          description: "Please select a date before searching.",
          variant: "destructive",
        });
    }
  };

  return (
    // Use passed className, apply defaults if none provided
    <Card className={cn("w-full shadow-md rounded-lg border border-border bg-card overflow-hidden", className)} {...props}>
        {/* Subtle gradient in header */}
        <CardHeader className="pb-4 pt-5 bg-gradient-to-b from-muted/30 to-transparent border-b border-border/50">
             <CardTitle className="text-lg font-semibold text-primary text-center flex items-center justify-center gap-2">
                <Search className="h-5 w-5"/> Search Recordings
             </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 px-4 py-6 sm:px-6"> {/* Adjusted padding and spacing */}
             {/* Use flex-col on small screens, sm:flex-row for larger */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-5"> {/* Increased gap */}
                 {/* Date Picker */}
                 <div className="flex-1 space-y-1.5">
                    <Label htmlFor="date-picker" className="flex items-center gap-1.5 text-sm font-medium"> {/* Added font-medium */}
                         <CalendarIcon className="h-4 w-4 text-muted-foreground" /> Date
                    </Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal rounded-lg border-input shadow-sm", // Increased rounding, added shadow
                            !date && "text-muted-foreground",
                            "focus-visible:ring-primary/50 focus-visible:border-primary" // Custom focus
                            )}
                            id="date-picker"
                        >
                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-popover border-border rounded-lg shadow-xl"> {/* Increased rounding, shadow */}
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                            disabled={(d) => d > new Date() || d < new Date("2000-01-01")}
                            className="bg-popover text-popover-foreground rounded-lg" // Style calendar itself
                         />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Time Input */}
                <div className="flex-1 space-y-1.5">
                    <Label htmlFor="time-input" className="flex items-center gap-1.5 text-sm font-medium"> {/* Added font-medium */}
                        <Clock className="h-4 w-4 text-muted-foreground" /> Time (HH:MM)
                    </Label>
                    <Input
                        id="time-input"
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full rounded-lg border-input shadow-sm focus-visible:ring-primary/50 focus-visible:border-primary" // Increased rounding, added shadow, custom focus
                        aria-label="Time for search"
                    />
                </div>
            </div>

             {/* Search Button */}
             <Button
                onClick={handleSearchClick}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg py-3 text-base font-semibold shadow-md transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-2" // Enhanced styling
                disabled={isLoading || !date}
              >
                 {isLoading ? (
                    <>
                        <Loader2 className="h-5 w-5 animate-spin" /> Searching...
                    </>
                 ) : (
                    <>
                        <Search className="h-5 w-5" /> Search Now
                    </>
                 )}
             </Button>
        </CardContent>
    </Card>
  );
};

export default DateTimeSearch;
