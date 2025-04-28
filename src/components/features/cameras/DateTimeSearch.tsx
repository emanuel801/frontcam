"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


interface DateTimeSearchProps {
  onSearch: (date: Date, time: string) => void;
  isLoading: boolean;
}

const DateTimeSearch: React.FC<DateTimeSearchProps> = ({ onSearch, isLoading }) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>(format(new Date(), 'HH:mm')); // Default to current time

  const handleSearchClick = () => {
    if (date) {
      onSearch(date, time);
    } else {
        alert("Please select a date."); // Basic validation
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-md">
        <CardHeader>
             <CardTitle className="text-lg font-semibold text-primary">Search Recordings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                 <div className="space-y-2">
                    <Label htmlFor="date-picker">Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                            )}
                            id="date-picker"
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                            disabled={(d) => d > new Date()} // Disable future dates
                         />
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="time-input">Time (HH:MM)</Label>
                    <Input
                        id="time-input"
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full"
                    />
                </div>
            </div>

             <Button onClick={handleSearchClick} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading || !date}>
                 <Search className="mr-2 h-4 w-4" />
                {isLoading ? 'Searching...' : 'Search'}
             </Button>
        </CardContent>
    </Card>
  );
};

export default DateTimeSearch;
