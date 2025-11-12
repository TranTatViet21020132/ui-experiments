"use client";

import { useEffect, useState, useCallback, memo, useMemo } from "react";
import { RiCalendarLine, RiDeleteBinLine } from "@remixicon/react";
import { format, isBefore, addDays } from "date-fns";

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
  onSave: (event: CalendarEvent | CalendarEvent[]) => void;
  onDelete: (eventId: string) => void;
}

// Constants
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
] as const;

const DURATION_OPTIONS = [
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
  { value: "120", label: "2 hours" },
  { value: "150", label: "2.5 hours" },
  { value: "180", label: "3 hours" },
] as const;

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const DEFAULT_COLOR = "#A855F7";

// Generate time options once at module level
const generateTimeOptions = () => {
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
};

const timeOptions = generateTimeOptions();

// Utility functions
const formatTimeForInput = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = Math.floor(date.getMinutes() / 15) * 15;
  return `${hours}:${minutes.toString().padStart(2, "0")}`;
};

const createDateWithTime = (date: Date, time: string): Date => {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
};

// Memoized components
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

    const handleCustomColorChange = useCallback(
      (value: string) => {
        setCustomColor(value);
        if (/^#[0-9A-F]{6}$/i.test(value)) {
          onColorChange(value);
        }
      },
      [onColorChange]
    );

    return (
      <div className="space-y-3">
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
                const value = e.target.value;
                setCustomColor(value);
                onColorChange(value);
              }}
              className="w-16 h-9 cursor-pointer"
            />
            <Input
              type="text"
              value={customColor}
              onChange={(e) => handleCustomColorChange(e.target.value)}
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

const SubjectManager = memo(
  ({
    subjects,
    selectedSubjectId,
    onSubjectChange,
    onDeleteSubject,
  }: {
    subjects: any[];
    selectedSubjectId: string | null;
    onSubjectChange: (subjectId: string, color: string) => void;
    onDeleteSubject: (id: string) => void;
  }) => (
    <RadioGroup
      className="flex flex-wrap gap-3"
      value={selectedSubjectId || ""}
      onValueChange={(subjectId) => {
        const subject = subjects.find((s) => s.id === subjectId);
        if (subject) {
          onSubjectChange(subjectId, subject.color);
        }
      }}
    >
      {subjects.map((subject) => (
        <div key={subject.id} className="relative group">
          <div className="flex flex-col items-center gap-1">
            <RadioGroupItem
              id={`subject-${subject.id}`}
              value={subject.id}
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
  const [color, setColor] = useState<EventColor>(DEFAULT_COLOR);
  const [subjectId, setSubjectId] = useState<string | null>(null);
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

  // Hooks
  const { data: subjects = [] } = useSubjects();
  const createSubject = useCreateSubject();
  const deleteSubject = useDeleteSubject();

  // Memoized initial state
  const initialState = useMemo(
    () => ({
      title: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(),
      startTime: `${DefaultStartHour}:00`,
      endTime: `${DefaultEndHour}:00`,
      allDay: false,
      location: "",
      color: DEFAULT_COLOR,
      subjectId: null,
      duration: "60",
      isRecurring: false,
      recurrenceEndDate: undefined,
      selectedDays: [],
    }),
    []
  );

  const resetForm = useCallback(() => {
    setTitle(initialState.title);
    setDescription(initialState.description);
    setStartDate(initialState.startDate);
    setEndDate(initialState.endDate);
    setStartTime(initialState.startTime);
    setEndTime(initialState.endTime);
    setAllDay(initialState.allDay);
    setLocation(initialState.location);
    setColor(initialState.color);
    setSubjectId(initialState.subjectId);
    setError(null);
    setDuration(initialState.duration);
    setIsRecurring(initialState.isRecurring);
    setRecurrenceEndDate(initialState.recurrenceEndDate);
    setSelectedDays(initialState.selectedDays);
  }, [initialState]);

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
        setColor(event.color || DEFAULT_COLOR);
        // Set subject ID from the event
        const eventSubjectId = event.subject || null;
        setSubjectId(eventSubjectId);
        // If event has a subject, use that subject's color, otherwise use event color
        if (eventSubjectId) {
          const subject = subjects.find((s) => s.id === eventSubjectId);
          if (subject) {
            setColor(subject.color);
          }
        }
      } else {
        resetForm();
      }
      setError(null);
    }
  }, [isOpen, event, resetForm, subjects]);

  // Ensure "Other" subject exists
  const ensureOtherSubject = useCallback(async () => {
    const otherSubject = subjects.find((s) => s.name === "Other");
    if (!otherSubject) {
      try {
        const newSubject = await createSubject.mutateAsync({
          name: "Other",
          color: DEFAULT_COLOR,
          isActive: true,
        });
        return { id: newSubject.id, color: newSubject.color };
      } catch (error) {
        console.error("Failed to create Other subject:", error);
        return { id: "", color: DEFAULT_COLOR };
      }
    }
    return { id: otherSubject.id, color: otherSubject.color };
  }, [subjects, createSubject]);

  // Generate recurring events
  const generateRecurringEvents = useCallback(
    (
      start: Date,
      durationMinutes: number,
      eventTitle: string,
      finalColor: string,
      finalSubjectId: string
    ): Omit<CalendarEvent, "id">[] => {
      if (!recurrenceEndDate || selectedDays.length === 0) return [];

      const events: Omit<CalendarEvent, "id">[] = [];
      let currentDate = new Date(start);

      while (currentDate <= recurrenceEndDate) {
        const dayOfWeek = currentDate.getDay();

        if (selectedDays.includes(dayOfWeek)) {
          const eventStart = new Date(currentDate);
          eventStart.setHours(start.getHours(), start.getMinutes(), 0, 0);

          const eventEnd = new Date(
            eventStart.getTime() + durationMinutes * 60000
          );

          events.push({
            title: eventTitle,
            description,
            start: eventStart,
            end: eventEnd,
            allDay: false,
            location,
            color: finalColor,
            subject: finalSubjectId,
          });
        }

        currentDate = addDays(currentDate, 1);
      }

      return events;
    },
    [recurrenceEndDate, selectedDays, description, location]
  );

  const handleSave = useCallback(async () => {
    try {
      const start = createDateWithTime(startDate, startTime);
      let end: Date;

      if (allDay) {
        start.setHours(0, 0, 0, 0);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      } else if (isRecurring) {
        const durationMinutes = parseInt(duration);
        end = new Date(start.getTime() + durationMinutes * 60000);
      } else {
        end = createDateWithTime(endDate, endTime);
      }

      // Validate dates
      if (isBefore(end, start)) {
        setError("End date cannot be before start date");
        return;
      }

      // Determine subject and color
      let finalSubjectId = subjectId;
      let finalColor = color;

      if (!subjectId) {
        const otherSubject = await ensureOtherSubject();
        finalSubjectId = otherSubject.id;
        finalColor = otherSubject.color;
      }

      // Get subject name for title if needed
      const selectedSubject = subjects.find((s) => s.id === finalSubjectId);
      const eventTitle =
        title.trim() || selectedSubject?.name || "Untitled Event";

      // Handle recurring events
      if (isRecurring && selectedDays.length > 0 && recurrenceEndDate) {
        const events = generateRecurringEvents(
          start,
          parseInt(duration),
          eventTitle,
          finalColor,
          finalSubjectId!
        );
        onSave(events as CalendarEvent[]);
      } else {
        // Single event
        onSave({
          id: event?.id || "",
          title: eventTitle,
          description,
          start,
          end,
          allDay,
          location,
          color: finalColor,
          subject: finalSubjectId || undefined,
        });
      }

      onClose();
    } catch (err) {
      console.error("Error saving event:", err);
      setError("Failed to save event. Please try again.");
    }
  }, [
    startDate,
    startTime,
    endDate,
    endTime,
    allDay,
    isRecurring,
    duration,
    title,
    description,
    location,
    color,
    subjectId,
    event?.id,
    selectedDays,
    recurrenceEndDate,
    subjects,
    ensureOtherSubject,
    generateRecurringEvents,
    onSave,
    onClose,
  ]);

  const handleDelete = useCallback(() => {
    if (event?.id) {
      onDelete(event.id);
      onClose();
    }
  }, [event?.id, onDelete, onClose]);

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

  const handleSubjectChange = useCallback(
    (subjectId: string, color: string) => {
      setSubjectId(subjectId);
      setColor(color);
    },
    []
  );

  const handleAddSubject = useCallback(async () => {
    if (newSubjectName.trim()) {
      try {
        const newSubject = await createSubject.mutateAsync({
          name: newSubjectName.trim(),
          color: newSubjectColor,
          isActive: true,
        });
        setNewSubjectName("");
        setNewSubjectColor("#3B82F6");
        setIsAddingSubject(false);
        // Auto-select the newly created subject
        setSubjectId(newSubject.id);
        setColor(newSubject.color);
      } catch (error) {
        console.error("Failed to create subject:", error);
      }
    }
  }, [newSubjectName, newSubjectColor, createSubject]);

  const handleDeleteSubject = useCallback(
    async (subjectId: string) => {
      try {
        await deleteSubject.mutateAsync(subjectId);
        // Clear selection if deleted subject was selected
        if (subjectId === subjectId) {
          setSubjectId(null);
          setColor(DEFAULT_COLOR);
        }
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
          {/* Subject Management */}
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
              selectedSubjectId={subjectId}
              onSubjectChange={handleSubjectChange}
              onDeleteSubject={handleDeleteSubject}
            />
          </fieldset>

          {/* Title */}
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
