"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { RiCalendarLine, RiDeleteBinLine } from "@remixicon/react";
import { format, isBefore } from "date-fns";

import type { CalendarEvent, EventColor } from "@/components/event-calendar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  StartHour,
  EndHour,
  DefaultStartHour,
  DefaultEndHour,
} from "@/components/event-calendar/constants";
import {
  useCreateSubject,
  useDeleteSubject,
  useSubjects,
} from "@/hooks/use-subjects";
import { Plus, X, Check } from "lucide-react";

interface EventDialogProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    event: CalendarEvent,
    recurrenceData?: {
      isRecurring: boolean;
      selectedDays: number[];
      recurrenceEndDate: Date;
    }
  ) => void;
  onDelete: (eventId: string) => void;
}

// Preset colors for quick selection
const PRESET_COLORS = [
  { value: "#EF4444", label: "Red" },
  { value: "#F97316", label: "Orange" },
  { value: "#F59E0B", label: "Amber" },
  { value: "#EAB308", label: "Yellow" },
  { value: "#84CC16", label: "Lime" },
  { value: "#22C55E", label: "Green" },
  { value: "#10B981", label: "Emerald" },
  { value: "#14B8A6", label: "Teal" },
  { value: "#06B6D4", label: "Cyan" },
  { value: "#0EA5E9", label: "Sky" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#6366F1", label: "Indigo" },
  { value: "#8B5CF6", label: "Violet" },
  { value: "#A855F7", label: "Purple" },
  { value: "#D946EF", label: "Fuchsia" },
  { value: "#EC4899", label: "Pink" },
  { value: "#F43F5E", label: "Rose" },
  { value: "#64748B", label: "Slate" },
];

// Generate time options once at module level
const timeOptions = (() => {
  const options = [];
  for (let hour = StartHour; hour <= EndHour; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const formattedHour = hour.toString().padStart(2, "0");
      const formattedMinute = minute.toString().padStart(2, "0");
      const value = `${formattedHour}:${formattedMinute}`;
      const date = new Date(2000, 0, 1, hour, minute);
      const label = format(date, "h:mm a");
      options.push({ value, label });
    }
  }
  return options;
})();

const DURATION_OPTIONS = [
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
  { value: "120", label: "2 hours" },
  { value: "150", label: "2.5 hours" },
  { value: "180", label: "3 hours" },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Memoized TimeSelect component
const TimeSelect = memo(
  ({
    id,
    value,
    onChange,
    label,
  }: {
    id: string;
    value: string;
    onChange: (value: string) => void;
    label: string;
  }) => (
    <div className="min-w-28 *:not-first:mt-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Select time" />
        </SelectTrigger>
        <SelectContent>
          {timeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
);

TimeSelect.displayName = "TimeSelect";

// Memoized DatePicker component
const DatePicker = memo(
  ({
    id,
    label,
    date,
    onDateChange,
    disabled,
    open,
    onOpenChange,
  }: {
    id: string;
    label: string;
    date: Date;
    onDateChange: (date: Date) => void;
    disabled?: { before: Date };
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => (
    <div className="flex-1 *:not-first:mt-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className={cn(
              "group bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]",
              !date && "text-muted-foreground"
            )}
          >
            <span className={cn("truncate", !date && "text-muted-foreground")}>
              {date ? format(date, "PPP") : "Pick a date"}
            </span>
            <RiCalendarLine
              size={16}
              className="text-muted-foreground/80 shrink-0"
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <Calendar
            mode="single"
            selected={date}
            defaultMonth={date}
            disabled={disabled}
            onSelect={(selectedDate) => {
              if (selectedDate) {
                onDateChange(selectedDate);
                onOpenChange(false);
              }
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
);

DatePicker.displayName = "DatePicker";

// Memoized DaySelector component
const DaySelector = memo(
  ({
    selectedDays,
    onToggleDay,
  }: {
    selectedDays: number[];
    onToggleDay: (index: number) => void;
  }) => (
    <div className="flex gap-2 flex-wrap mt-2">
      {DAYS.map((day, index) => (
        <Button
          key={day}
          type="button"
          variant={selectedDays.includes(index) ? "default" : "outline"}
          size="sm"
          onClick={() => onToggleDay(index)}
        >
          {day}
        </Button>
      ))}
    </div>
  )
);

DaySelector.displayName = "DaySelector";

// Memoized ColorPicker component
const ColorPicker = memo(
  ({
    selectedColor,
    onColorChange,
  }: {
    selectedColor: string;
    onColorChange: (color: string) => void;
  }) => {
    const [customColor, setCustomColor] = useState(selectedColor);

    useEffect(() => {
      setCustomColor(selectedColor);
    }, [selectedColor]);

    return (
      <div className="space-y-3">
        {/* Preset Colors */}
        <div className="grid grid-cols-9 gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => onColorChange(color.value)}
              className={cn(
                "size-8 rounded-md border-2 transition-all hover:scale-110",
                selectedColor === color.value
                  ? "border-foreground ring-2 ring-offset-2 ring-foreground"
                  : "border-transparent"
              )}
              style={{ backgroundColor: color.value }}
              aria-label={color.label}
              title={color.label}
            >
              {selectedColor === color.value && (
                <Check className="h-4 w-4 text-white mx-auto drop-shadow-md" />
              )}
            </button>
          ))}
        </div>

        {/* Custom Color Picker */}
        <div className="flex gap-2 items-center pt-2 border-t">
          <Label htmlFor="custom-color" className="text-sm">
            Custom:
          </Label>
          <div className="flex gap-2 flex-1">
            <Input
              id="custom-color"
              type="color"
              value={customColor}
              onChange={(e) => {
                setCustomColor(e.target.value);
                onColorChange(e.target.value);
              }}
              className="w-16 h-9 cursor-pointer"
            />
            <Input
              type="text"
              value={customColor}
              onChange={(e) => {
                const value = e.target.value;
                setCustomColor(value);
                if (/^#[0-9A-F]{6}$/i.test(value)) {
                  onColorChange(value);
                }
              }}
              placeholder="#3B82F6"
              className="flex-1 font-mono text-sm"
            />
          </div>
        </div>
      </div>
    );
  }
);

ColorPicker.displayName = "ColorPicker";

// Memoized SubjectManager component
const SubjectManager = memo(
  ({
    subjects,
    selectedColor,
    onColorChange,
    onDeleteSubject,
  }: {
    subjects: any[];
    selectedColor: string;
    onColorChange: (color: string) => void;
    onDeleteSubject: (id: string) => void;
  }) => (
    <RadioGroup
      className="flex flex-wrap gap-3"
      value={selectedColor}
      onValueChange={onColorChange}
    >
      {subjects.map((subject) => (
        <div key={subject.id} className="relative group">
          <div className="flex flex-col items-center gap-1">
            <RadioGroupItem
              id={`color-${subject.id}`}
              value={subject.color}
              aria-label={subject.name}
              className="size-10 shadow-sm border-2 transition-all hover:scale-105"
              style={{
                backgroundColor: subject.color,
                borderColor: subject.color,
              }}
            />
            <span className="text-xs text-center max-w-[60px] truncate">
              {subject.name}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground rounded-full shadow-sm"
            onClick={(e) => {
              e.preventDefault();
              onDeleteSubject(subject.id);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </RadioGroup>
  )
);

SubjectManager.displayName = "SubjectManager";

export function EventDialog({
  event,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: EventDialogProps) {
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState(`${DefaultStartHour}:00`);
  const [endTime, setEndTime] = useState(`${DefaultEndHour}:00`);
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState("");
  const [color, setColor] = useState<EventColor>("#3B82F6");
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [recurrenceEndDateOpen, setRecurrenceEndDateOpen] = useState(false);

  // Recurring event state
  const [duration, setDuration] = useState("60");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<
    Date | undefined
  >();
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  // Subject management state
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectColor, setNewSubjectColor] = useState("#3B82F6");

  // Fetch subjects from database
  const { data: subjects = [] } = useSubjects();
  const createSubject = useCreateSubject();
  const deleteSubject = useDeleteSubject();

  const formatTimeForInput = useCallback((date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = Math.floor(date.getMinutes() / 15) * 15;
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  }, []);

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setStartDate(new Date());
    setEndDate(new Date());
    setStartTime(`${DefaultStartHour}:00`);
    setEndTime(`${DefaultEndHour}:00`);
    setAllDay(false);
    setLocation("");
    setColor("#3B82F6");
    setError(null);
    setDuration("60");
    setIsRecurring(false);
    setRecurrenceEndDate(undefined);
    setSelectedDays([]);
  }, []);

  // Initialize form when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (event) {
        setTitle(event.title || "");
        setDescription(event.description || "");
        const start = new Date(event.start);
        const end = new Date(event.end);
        setStartDate(start);
        setEndDate(end);
        setStartTime(formatTimeForInput(start));
        setEndTime(formatTimeForInput(end));
        setAllDay(event.allDay || false);
        setLocation(event.location || "");
        setColor(event.color || "#3B82F6");
      } else {
        resetForm();
      }
      setError(null);
    }
  }, [isOpen, event, formatTimeForInput, resetForm]);

  const handleSave = useCallback(() => {
    const start = new Date(startDate);
    let end = new Date(endDate);

    if (!allDay) {
      const [startHours = 0, startMinutes = 0] = startTime
        .split(":")
        .map(Number);

      if (startHours < StartHour || startHours > EndHour) {
        setError(
          `Selected time must be between ${StartHour}:00 and ${EndHour}:00`
        );
        return;
      }

      start.setHours(startHours, startMinutes, 0);

      if (isRecurring) {
        end = new Date(start);
        end.setMinutes(end.getMinutes() + parseInt(duration));
      } else {
        const [endHours = 0, endMinutes = 0] = endTime.split(":").map(Number);

        if (endHours < StartHour || endHours > EndHour) {
          setError(
            `Selected time must be between ${StartHour}:00 and ${EndHour}:00`
          );
          return;
        }

        end.setHours(endHours, endMinutes, 0);
      }
    } else {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    if (isBefore(end, start)) {
      setError("End date cannot be before start date");
      return;
    }

    if (isRecurring) {
      if (selectedDays.length === 0) {
        setError("Please select at least one day for recurring events");
        return;
      }
      if (!recurrenceEndDate) {
        setError("Please select an end date for recurring events");
        return;
      }
      if (isBefore(recurrenceEndDate, startDate)) {
        setError("Recurrence end date must be after start date");
        return;
      }
    }

    // Determine the title to use
    let eventTitle = title.trim();
    if (!eventTitle) {
      // Find the subject with matching color
      const matchingSubject = subjects.find((s) => s.color === color);
      eventTitle = matchingSubject ? matchingSubject.name : "(no title)";
    }

    const eventData = {
      id: event?.id || "",
      title: eventTitle,
      description,
      start,
      end,
      allDay,
      location,
      color,
    };

    if (isRecurring && recurrenceEndDate) {
      onSave(eventData, {
        isRecurring: true,
        selectedDays,
        recurrenceEndDate,
      });
    } else {
      onSave(eventData);
    }
  }, [
    startDate,
    endDate,
    allDay,
    startTime,
    endTime,
    title,
    description,
    location,
    color,
    event?.id,
    isRecurring,
    selectedDays,
    recurrenceEndDate,
    duration,
    subjects,
    onSave,
  ]);

  const handleDelete = useCallback(() => {
    if (event?.id) {
      onDelete(event.id);
    }
  }, [event?.id, onDelete]);

  const handleStartDateChange = useCallback(
    (date: Date) => {
      setStartDate(date);
      if (isBefore(endDate, date)) {
        setEndDate(date);
      }
      setError(null);
    },
    [endDate]
  );

  const handleEndDateChange = useCallback((date: Date) => {
    setEndDate(date);
    setError(null);
  }, []);

  const handleToggleDay = useCallback((index: number) => {
    setSelectedDays((prev) =>
      prev.includes(index)
        ? prev.filter((d) => d !== index)
        : [...prev, index].sort()
    );
  }, []);

  const handleAddSubject = useCallback(async () => {
    if (newSubjectName.trim()) {
      try {
        await createSubject.mutateAsync({
          name: newSubjectName.trim(),
          color: newSubjectColor,
          isActive: true,
        });
        setNewSubjectName("");
        setNewSubjectColor("#3B82F6");
        setIsAddingSubject(false);
      } catch (error) {
        console.error("Failed to create subject:", error);
      }
    }
  }, [newSubjectName, newSubjectColor, createSubject]);

  const handleDeleteSubject = useCallback(
    async (subjectId: string) => {
      try {
        await deleteSubject.mutateAsync(subjectId);
      } catch (error) {
        console.error("Failed to delete subject:", error);
      }
    },
    [deleteSubject]
  );

  const handleCancelAddSubject = useCallback(() => {
    setIsAddingSubject(false);
    setNewSubjectName("");
    setNewSubjectColor("#3B82F6");
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event?.id ? "Edit Event" : "Create Event"}</DialogTitle>
          <DialogDescription className="sr-only">
            {event?.id
              ? "Edit the details of this event"
              : "Add a new event to your calendar"}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/15 text-destructive rounded-md px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-4 py-4">
          {/* Subject Management - Moved to top */}
          <fieldset className="space-y-3">
            <div className="flex items-center justify-between">
              <legend className="text-foreground text-sm leading-none font-medium">
                Subject
              </legend>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingSubject(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Subject
              </Button>
            </div>

            {isAddingSubject && (
              <div className="space-y-3 p-3 border rounded-md bg-muted/30">
                <Input
                  placeholder="Subject name (e.g., Mathematics)"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                />
                <ColorPicker
                  selectedColor={newSubjectColor}
                  onColorChange={setNewSubjectColor}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAddSubject}
                    className="flex-1"
                  >
                    Add Subject
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelAddSubject}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <SubjectManager
              subjects={subjects}
              selectedColor={color}
              onColorChange={setColor}
              onDeleteSubject={handleDeleteSubject}
            />
          </fieldset>

          {/* Title - Now optional */}
          <div className="*:not-first:mt-1.5">
            <Label htmlFor="title" className="flex items-center gap-2">
              Title
              <span className="text-xs text-muted-foreground font-normal">
                (optional - uses subject name if empty)
              </span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter event title"
            />
          </div>

          {/* Description */}
          <div className="*:not-first:mt-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add event details..."
            />
          </div>

          {/* Start Date/Time */}
          <div className="flex gap-4">
            <DatePicker
              id="start-date"
              label="Start Date"
              date={startDate}
              onDateChange={handleStartDateChange}
              open={startDateOpen}
              onOpenChange={setStartDateOpen}
            />
            {!allDay && (
              <TimeSelect
                id="start-time"
                label="Start Time"
                value={startTime}
                onChange={setStartTime}
              />
            )}
          </div>

          {/* End Date/Time OR Duration */}
          {!isRecurring && (
            <div className="flex gap-4">
              <DatePicker
                id="end-date"
                label="End Date"
                date={endDate}
                onDateChange={handleEndDateChange}
                disabled={{ before: startDate }}
                open={endDateOpen}
                onOpenChange={setEndDateOpen}
              />
              {!allDay && (
                <TimeSelect
                  id="end-time"
                  label="End Time"
                  value={endTime}
                  onChange={setEndTime}
                />
              )}
            </div>
          )}

          {isRecurring && !allDay && (
            <div className="*:not-first:mt-1.5">
              <Label htmlFor="duration">Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* All day checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="all-day"
              checked={allDay}
              onCheckedChange={(checked) => setAllDay(checked === true)}
            />
            <Label htmlFor="all-day">All day</Label>
          </div>

          {/* Location */}
          <div className="*:not-first:mt-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location"
            />
          </div>

          {/* Recurring Event Section */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={isRecurring}
                onCheckedChange={(checked) =>
                  setIsRecurring(checked as boolean)
                }
              />
              <Label htmlFor="recurring">Repeat weekly</Label>
            </div>

            {isRecurring && (
              <>
                <div className="space-y-2 mt-2">
                  <Label>Repeat on</Label>
                  <DaySelector
                    selectedDays={selectedDays}
                    onToggleDay={handleToggleDay}
                  />
                </div>

                <div className="flex-1 *:not-first:mt-1.5">
                  <Label htmlFor="recurrence-end-date">Repeat until</Label>
                  <Popover
                    open={recurrenceEndDateOpen}
                    onOpenChange={setRecurrenceEndDateOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        id="recurrence-end-date"
                        variant="outline"
                        className={cn(
                          "group bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]",
                          !recurrenceEndDate && "text-muted-foreground"
                        )}
                      >
                        <span
                          className={cn(
                            "truncate",
                            !recurrenceEndDate && "text-muted-foreground"
                          )}
                        >
                          {recurrenceEndDate
                            ? format(recurrenceEndDate, "PPP")
                            : "Pick end date"}
                        </span>
                        <RiCalendarLine
                          size={16}
                          className="text-muted-foreground/80 shrink-0"
                          aria-hidden="true"
                        />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2" align="start">
                      <Calendar
                        mode="single"
                        selected={recurrenceEndDate}
                        defaultMonth={recurrenceEndDate || startDate}
                        disabled={{ before: startDate }}
                        onSelect={(selectedDate) => {
                          if (selectedDate) {
                            setRecurrenceEndDate(selectedDate);
                            setRecurrenceEndDateOpen(false);
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="flex-row sm:justify-between">
          {event?.id && (
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              size="icon"
              onClick={handleDelete}
              aria-label="Delete event"
            >
              <RiDeleteBinLine size={16} aria-hidden="true" />
            </Button>
          )}
          <div className="flex flex-1 justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
