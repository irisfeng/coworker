"use client";

import { useState, useEffect } from "react";
import dayjs from "@/lib/dayjs";

type ReportType = "daily" | "weekly" | "project";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("daily");
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [project, setProject] = useState("");
  const [projects, setProjects] = useState<string[]>([]);
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((tasks: { project_tag?: string | null }[]) => {
        const tags = [
          ...new Set(
            tasks.map((t) => t.project_tag).filter((t): t is string => !!t)
          ),
        ];
        setProjects(tags.sort());
      })
      .catch(() => {});
  }, []);

  const generate = async () => {
    setLoading(true);
    setReport("");
    try {
      const res = await fetch("/api/ai/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: reportType,
          date,
          ...(reportType === "project" && project ? { project } : {}),
        }),
      });
      const data = await res.json();
      setReport(data.report || "暂无数据可生成报告");
    } catch {
      setReport("生成失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const copyReport = async () => {
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const types: { value: ReportType; label: string }[] = [
    { value: "daily", label: "日报" },
    { value: "weekly", label: "周报" },
    { value: "project", label: "项目" },
  ];

  return (
    <div className="px-4 pt-8">
      <h1 className="text-2xl font-semibold tracking-tight text-warm-800 mb-5">报告</h1>

      <div className="flex gap-2 mb-4">
        {types.map((t) => (
          <button
            key={t.value}
            onClick={() => setReportType(t.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
              reportType === t.value
                ? "bg-accent text-white shadow-sm"
                : "bg-white text-warm-600 border border-warm-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-5">
        {reportType === "project" ? (
          <select
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className="flex-1 bg-white rounded-xl px-3 py-2.5 text-sm outline-none border border-warm-200 focus:border-accent"
          >
            <option value="">全部项目</option>
            {projects.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 bg-white rounded-xl px-3 py-2.5 text-sm outline-none border border-warm-200 focus:border-accent"
          />
        )}
        <button
          onClick={generate}
          disabled={loading}
          className="bg-accent text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-30 shadow-sm transition-colors"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              生成中
            </span>
          ) : "生成报告"}
        </button>
      </div>

      {report && (
        <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-warm-200/60">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-warm-500 font-medium">
              {reportType === "daily" ? "日报" : reportType === "weekly" ? "周报" : "项目报告"}
              {reportType === "project" && project ? ` · ${project}` : reportType !== "project" ? ` · ${date}` : ""}
            </span>
            <button
              onClick={copyReport}
              className={`text-xs font-medium transition-colors ${
                copied ? "text-success" : "text-accent"
              }`}
            >
              {copied ? "已复制" : "复制内容"}
            </button>
          </div>
          <div className="border-t border-warm-200/60 pt-3">
            <pre className="text-sm whitespace-pre-wrap leading-relaxed text-warm-700 font-[inherit]">{report}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
