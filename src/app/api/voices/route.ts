import { NextResponse } from "next/server";

export type Voice = {
  id: string;
  name: string;
  description: string;
  initial: string;
  color: string;
  bg: string;
  previewUrl: string;
};

const voices: Voice[] = [
  {
    id: "sarah",
    name: "Sarah",
    description: "Professional, friendly female voice",
    initial: "S",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    previewUrl: "/audio/sarah-preview.mp3"
  },
  {
    id: "michael",
    name: "Michael",
    description: "Confident, authoritative male voice",
    initial: "M",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    previewUrl: "/audio/michael-preview.mp3"
  },
  {
    id: "emma",
    name: "Emma",
    description: "Warm, conversational female voice",
    initial: "E",
    color: "text-purple-600",
    bg: "bg-purple-50",
    previewUrl: "/audio/emma-preview.mp3"
  },
  {
    id: "david",
    name: "David",
    description: "Energetic, enthusiastic male voice",
    initial: "D",
    color: "text-amber-600",
    bg: "bg-amber-50",
    previewUrl: "/audio/david-preview.mp3"
  },
  {
    id: "anna",
    name: "Anna",
    description: "Sophisticated, elegant female voice",
    initial: "A",
    color: "text-slate-900",
    bg: "bg-white",
    previewUrl: "/audio/anna-preview.mp3"
  },
  {
    id: "james",
    name: "James",
    description: "Mature, trustworthy male voice",
    initial: "J",
    color: "text-blue-600",
    bg: "bg-blue-50",
    previewUrl: "/audio/james-preview.mp3"
  }
];

export async function GET() {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return NextResponse.json(voices);
}
