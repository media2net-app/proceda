"use client";

import { useMemo, useState } from "react";
import type { DemoTask } from "@/lib/demo-app/types";
import { useMakelaarPortal } from "./MakelaarPortalContext";
import {
  AgentAvatar,
  DemoPageHeader,
  DemoSearchBar,
  FilterChip,
  useDemoAction,
} from "./demo-ui";

const PRIORITY_STYLE: Record<DemoTask["priority"], string> = {
  hoog: "bg-[#FEF3F2] text-[#B42318]",
  normaal: "bg-[#F2F4F7] text-[#475467]",
  laag: "bg-[#F9FAFB] text-[#667085]",
};

const CATEGORY_LABEL: Record<DemoTask["category"], string> = {
  taxatie: "Taxatie",
  bezichtiging: "Bezichtiging",
  document: "Document",
  marketing: "Marketing",
  compliance: "Compliance",
};

export default function MakelaarTasksContent() {
  const { brand, data } = useMakelaarPortal();
  const primary = brand.primaryColor;
  const { run, Toast } = useDemoAction();
  const [search, setSearch] = useState("");
  const [tasks, setTasks] = useState(data.tasks);
  const [filter, setFilter] = useState<"open" | "done" | "all">("open");

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        t.title.toLowerCase().includes(q) ||
        (t.property?.toLowerCase().includes(q) ?? false);
      const matchDone =
        filter === "all" ||
        (filter === "open" && !t.done) ||
        (filter === "done" && t.done);
      return matchSearch && matchDone;
    });
  }, [tasks, search, filter]);

  const openCount = tasks.filter((t) => !t.done).length;

  return (
    <>
      {Toast}
      <DemoPageHeader
        brand={brand}
        title="Taken & activiteiten"
        subtitle={`${openCount} openstaand · teambreed overzicht`}
        action={
          <button
            type="button"
            onClick={() => run("Taak toegevoegd (demo)")}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-xs"
            style={{ backgroundColor: primary }}
          >
            + Taak toevoegen
          </button>
        }
      />

      <DemoSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Zoek taak of woning…"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <FilterChip
          label="Open"
          active={filter === "open"}
          onClick={() => setFilter("open")}
          primaryColor={primary}
        />
        <FilterChip
          label="Afgerond"
          active={filter === "done"}
          onClick={() => setFilter("done")}
          primaryColor={primary}
        />
        <FilterChip
          label="Alle"
          active={filter === "all"}
          onClick={() => setFilter("all")}
          primaryColor={primary}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#EAECF0] bg-white shadow-xs">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-[#EAECF0] bg-[#F9FAFB] text-xs text-[#667085]">
            <tr>
              <th className="px-4 py-3 font-medium w-10" />
              <th className="px-4 py-3 font-medium">Taak</th>
              <th className="px-4 py-3 font-medium">Categorie</th>
              <th className="px-4 py-3 font-medium">Prioriteit</th>
              <th className="px-4 py-3 font-medium">Deadline</th>
              <th className="px-4 py-3 font-medium">Makelaar</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((task) => (
              <tr
                key={task.id}
                className={`border-b border-[#EAECF0] last:border-b-0 ${
                  task.done ? "bg-[#F9FAFB]/80" : "hover:bg-[#F9FAFB]"
                }`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={!!task.done}
                    onChange={() => {
                      setTasks((prev) =>
                        prev.map((t) =>
                          t.id === task.id ? { ...t, done: !t.done } : t,
                        ),
                      );
                      run(task.done ? "Taak heropend" : "Taak afgerond");
                    }}
                    className="h-4 w-4 rounded border-[#D0D5DD]"
                  />
                </td>
                <td className="px-4 py-3">
                  <p
                    className={`font-medium ${
                      task.done ? "text-[#98A2B3] line-through" : "text-[#101828]"
                    }`}
                  >
                    {task.title}
                  </p>
                  {task.property && (
                    <p className="text-xs text-[#667085]">{task.property}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-[#475467]">
                  {CATEGORY_LABEL[task.category]}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                      PRIORITY_STYLE[task.priority]
                    }`}
                  >
                    {task.priority}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#667085]">{task.due}</td>
                <td className="px-4 py-3">
                  <AgentAvatar initials={task.assignee} primaryColor={primary} size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
        <h2 className="text-base font-semibold text-[#101828]">Activiteitenfeed</h2>
        <ul className="mt-3 space-y-2 text-sm text-[#475467]">
          {data.activities.map((item) => (
            <li
              key={item}
              className="rounded-lg border border-[#EAECF0] bg-[#F9FAFB] px-3 py-2"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
