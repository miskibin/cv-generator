import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, X } from "lucide-react";

// Form section component with title and optional action button
interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function FormSection({ title, children, action }: FormSectionProps) {
  return (
    <div className="border rounded-md overflow-hidden">
      <div className="flex justify-between items-center px-4 py-3 bg-slate-50 border-b">
        <h3 className="font-medium text-sm">{title}</h3>
        {action}
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
}

// Field group for organizing form inputs
interface FieldGroupProps {
  className?: string;
  children: React.ReactNode;
}

export function FieldGroup({ className = "", children }: FieldGroupProps) {
  return <div className={`space-y-2 ${className}`}>{children}</div>;
}

// Badge item for skills, technologies, etc.
interface BadgeItemProps {
  text: string;
  onRemove: () => void;
  small?: boolean;
}

export function BadgeItem({ text, onRemove, small = false }: BadgeItemProps) {
  return (
    <Badge
      variant={small ? "outline" : "secondary"}
      className={`flex items-center gap-1 ${
        small ? "py-0 px-1 text-xs" : "py-0.5 pl-2 pr-1"
      }`}
    >
      {text}
      <button
        type="button"
        onClick={onRemove}
        className={
          small
            ? "ml-1 hover:text-red-500"
            : "rounded-full hover:bg-slate-200 p-0.5"
        }
      >
        <X className={small ? "h-2 w-2" : "h-3 w-3"} />
      </button>
    </Badge>
  );
}

// Item card for experiences, education, projects
interface ItemCardProps {
  title: string;
  onRemove: () => void;
  children: React.ReactNode;
}

export function ItemCard({ title, onRemove, children }: ItemCardProps) {
  return (
    <div className="p-3 border rounded-md space-y-3">
      <div className="flex justify-between items-start">
        <h4 className="font-medium">{title}</h4>
        <Button variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

// Add button component
interface AddButtonProps {
  onClick: () => void;
  text: string;
  fullWidth?: boolean;
}

export function AddButton({
  onClick,
  text,
  fullWidth = false,
}: AddButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="sm"
      variant="outline"
      className={fullWidth ? "w-full" : ""}
    >
      <Plus className="h-4 w-4 mr-1" /> {text}
    </Button>
  );
}

// Skills input with add functionality
interface SkillsInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAdd: () => void;
  placeholder?: string;
}

export function SkillsInput({
  value,
  onChange,
  onAdd,
  placeholder = "Add a skill...",
}: SkillsInputProps) {
  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onKeyPress={(e) => e.key === "Enter" && onAdd()}
        className="flex-1"
      />
      <Button onClick={onAdd} size="sm">
        Add
      </Button>
    </div>
  );
}

// Badge list for displaying skills/technologies
interface BadgeListProps {
  items: string[];
  onRemove: (index: number) => void;
  small?: boolean;
}

export function BadgeList({ items, onRemove, small = false }: BadgeListProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, index) => (
        <BadgeItem
          key={index}
          text={item}
          onRemove={() => onRemove(index)}
          small={small}
        />
      ))}
    </div>
  );
}

// Field with label
interface LabeledFieldProps {
  label: string;
  children: React.ReactNode;
}

export function LabeledField({ label, children }: LabeledFieldProps) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

// Project technology section
interface TechnologiesProps {
  technologies: string[];
  onChange: (technologies: string[]) => void;
}

export function Technologies({ technologies, onChange }: TechnologiesProps) {
  const [tech, setTech] = React.useState("");

  const addTech = () => {
    if (!tech.trim()) return;
    onChange([...technologies, tech.trim()]);
    setTech("");
  };

  const removeTech = (index: number) => {
    const newTechs = [...technologies];
    newTechs.splice(index, 1);
    onChange(newTechs);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">Technologies</Label>
      <div className="flex items-center gap-2">
        <Input
          value={tech}
          onChange={(e) => setTech(e.target.value)}
          placeholder="Add a technology..."
          onKeyPress={(e) => e.key === "Enter" && addTech()}
          className="flex-1 h-8 text-sm"
        />
        <Button onClick={addTech} size="sm" variant="outline" className="h-8">
          Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-1">
        {technologies.map((t, i) => (
          <BadgeItem key={i} text={t} onRemove={() => removeTech(i)} small />
        ))}
      </div>
    </div>
  );
}
