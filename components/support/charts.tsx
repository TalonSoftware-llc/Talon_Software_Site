"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money } from "@/lib/support/format";

export const spendPalette = ["#1f4d45", "#1b2430", "#3e7c6f", "#c4a574", "#6d7c8a", "#8fa89a", "#245c6b", "#4d4538"];

const tooltipStyle = { borderRadius: 8, borderColor: "#e1e6ec", fontSize: 13 };

export function SpendPie({
  data,
  selected,
  onPick,
}: {
  data: { name: string; amount: number }[];
  selected?: string;
  onPick?: (name: string) => void;
}) {
  return (
    <div className="h-80 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="name"
            innerRadius={0}
            outerRadius="82%"
            stroke="#ffffff"
            strokeWidth={2}
            cursor={onPick ? "pointer" : "default"}
            onClick={(_, index) => onPick?.(data[index]?.name ?? "")}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={spendPalette[index % spendPalette.length]}
                opacity={!selected || selected === entry.name ? 1 : 0.35}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value) => money(Number(value ?? 0))} contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SpendBars({
  data,
  onPick,
}: {
  data: { label: string; spend: number; budget: number }[];
  onPick: (label: string) => void;
}) {
  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2}>
          <CartesianGrid stroke="#e6ebf0" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#5c6b7a" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#5c6b7a" }} axisLine={false} tickLine={false} width={48} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
          <Tooltip formatter={(value, name) => [money(Number(value ?? 0)), name === "spend" ? "Spend" : "Budget"]} contentStyle={tooltipStyle} />
          <Bar dataKey="spend" fill={spendPalette[0]} radius={[3, 3, 0, 0]} cursor="pointer" onClick={(_, index) => onPick(data[index]?.label ?? "")} />
          <Bar dataKey="budget" fill="#c9d3dc" radius={[3, 3, 0, 0]} cursor="pointer" onClick={(_, index) => onPick(data[index]?.label ?? "")} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrafficBars({
  data,
  onPick,
}: {
  data: { label: string; visitors: number; sessions: number }[];
  onPick: (label: string) => void;
}) {
  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="#e6ebf0" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#5c6b7a" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#5c6b7a" }} axisLine={false} tickLine={false} width={40} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="visitors" fill="#1f4d45" radius={[3, 3, 0, 0]} cursor="pointer" onClick={(_, index) => onPick(data[index]?.label ?? "")} />
          <Bar dataKey="sessions" fill="#8fa89a" radius={[3, 3, 0, 0]} cursor="pointer" onClick={(_, index) => onPick(data[index]?.label ?? "")} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TicketBars({
  data,
  onPick,
}: {
  data: { label: string; opened: number; resolved: number }[];
  onPick: (label: string) => void;
}) {
  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="#e6ebf0" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#5c6b7a" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#5c6b7a" }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="opened" fill="#1b2430" radius={[3, 3, 0, 0]} cursor="pointer" onClick={(_, index) => onPick(data[index]?.label ?? "")} />
          <Bar dataKey="resolved" fill="#3e7c6f" radius={[3, 3, 0, 0]} cursor="pointer" onClick={(_, index) => onPick(data[index]?.label ?? "")} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ScoreLine({ data }: { data: { label: string; score: number }[] }) {
  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="#e6ebf0" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#5c6b7a" }} axisLine={false} tickLine={false} />
          <YAxis domain={[60, 100]} tick={{ fontSize: 12, fill: "#5c6b7a" }} axisLine={false} tickLine={false} width={32} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line dataKey="score" stroke="#1f4d45" strokeWidth={2} dot={{ r: 3 }} type="monotone" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export const chartPalette = spendPalette;
