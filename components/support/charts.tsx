"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Sector, Tooltip, XAxis, YAxis } from "recharts";
import type { PieSectorDataItem } from "recharts/types/polar/Pie";
import { money } from "@/lib/support/format";

export const spendPalette = ["#1f4d45", "#1b2430", "#3e7c6f", "#c4a574", "#6d7c8a", "#8fa89a", "#245c6b", "#4d4538"];

const tooltipStyle = { borderRadius: 8, borderColor: "#e1e6ec", fontSize: 13 };

function sliceNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function SliceShape(props: PieSectorDataItem & { outlined?: boolean }) {
  const outer = sliceNumber(props.outerRadius);
  const opacity = typeof props.opacity === "number" ? props.opacity : 1;
  return (
    <g opacity={opacity} style={props.outlined ? { filter: "drop-shadow(0 2px 1px rgba(27,36,48,0.28))" } : undefined}>
      <Sector
        cx={sliceNumber(props.cx)}
        cy={sliceNumber(props.cy)}
        innerRadius={sliceNumber(props.innerRadius)}
        outerRadius={props.outlined ? outer + 6 : outer}
        startAngle={sliceNumber(props.startAngle)}
        endAngle={sliceNumber(props.endAngle)}
        fill={props.fill}
        stroke={props.fill}
        strokeWidth={1}
        strokeLinejoin="round"
      />
    </g>
  );
}

function tipStyle(pointX: number, pointY: number, cx: number, height: number): { left: number; top: number; transform: string } {
  const shiftX = pointX >= cx ? "10px" : "calc(-100% - 10px)";
  const shiftY = pointY < 32 ? "0px" : height - pointY < 32 ? "calc(-100% - 4px)" : "-50%";
  return { left: pointX, top: pointY, transform: `translate(${shiftX}, ${shiftY})` };
}

export function SpendPie({
  data,
  selected,
  onPick,
}: {
  data: { name: string; amount: number }[];
  selected?: string;
  onPick?: (name: string) => void;
}) {
  const [tip, setTip] = useState<{ name: string; amount: number; left: number; top: number; transform: string } | null>(null);

  function showTip(entry: PieSectorDataItem, height: number) {
    const cx = sliceNumber(entry.cx);
    const outer = sliceNumber(entry.outerRadius);
    const angle = sliceNumber(entry.midAngle);
    const radius = outer + 4;
    const x = cx + Math.cos((-Math.PI / 180) * angle) * radius;
    const y = sliceNumber(entry.cy) + Math.sin((-Math.PI / 180) * angle) * radius;
    const place = tipStyle(x, y, cx, height);
    setTip({ name: String(entry.name ?? ""), amount: sliceNumber(entry.value), ...place });
  }

  return (
    <div className="relative h-80 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="name"
            innerRadius={0}
            outerRadius="78%"
            paddingAngle={0}
            stroke="none"
            isAnimationActive={false}
            activeShape={(props) => <SliceShape {...props} outlined />}
            shape={(props) => <SliceShape {...props} outlined={selected === props.name} />}
            cursor={onPick ? "pointer" : "default"}
            onMouseEnter={(entry) => showTip(entry, 320)}
            onMouseLeave={() => setTip(null)}
            onClick={(entry, index) => {
              const name = data[index]?.name ?? (typeof entry.name === "string" ? entry.name : "");
              if (name) onPick?.(name);
            }}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={spendPalette[index % spendPalette.length]}
                stroke={spendPalette[index % spendPalette.length]}
                opacity={!selected || selected === entry.name ? 1 : 0.35}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {tip ? (
        <div
          className="pointer-events-none absolute z-10 whitespace-nowrap rounded-md border border-[#e1e6ec] bg-white px-2 py-1 text-xs font-semibold text-ink shadow-sm"
          style={{ left: tip.left, top: tip.top, transform: tip.transform }}
        >
          {tip.name} · {money(tip.amount)}
        </div>
      ) : null}
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
        <BarChart data={data}>
          <CartesianGrid stroke="#e6ebf0" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#5c6b7a" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#5c6b7a" }} axisLine={false} tickLine={false} width={48} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
          <Tooltip formatter={(value) => [money(Number(value ?? 0)), "Spend"]} contentStyle={tooltipStyle} />
          <Bar dataKey="spend" name="Spend" fill={spendPalette[0]} radius={[3, 3, 0, 0]} cursor="pointer" onClick={(_, index) => onPick(data[index]?.label ?? "")} />
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
