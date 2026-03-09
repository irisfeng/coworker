"use client";

import { useState } from "react";
import dayjs from "dayjs";

type ReportType = "daily" | "weekly" | "project";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("daily");
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    setReport("");
    try {
      const res = await fetch("/api/ai/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: reportType, date }),
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
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold mb-4">报告</h1>

      <div className="flex gap-2 mb-4">
        {types.map((t) => (
          <button
            key={t.value}
            onClick={() => setReportType(t.value)}
            className={`px-3 py-1.5 rounded-full text-xs ${
              reportType === t.value
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="flex-1 bg-gray-100 rounded-lg px-3 py-2 text-sm outline-none"
        />
        <button
          onClick={generate}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-40"
        >
          {loading ? "生成中..." : "生成"}
        </button>
      </div>

      {report && (
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">报告内容</span>
            <button
              onClick={copyReport}
              className="text-xs text-blue-500"
            >
              {copied ? "已复制" : "复制"}
            </button>
          </div>
          <pre className="text-sm whitespace-pre-wrap leading-relaxed">{report}</pre>
        </div>
      )}
    </div>
  );
}
