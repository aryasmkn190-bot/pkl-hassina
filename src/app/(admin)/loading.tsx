import React from "react";

export default function LoadingPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-5 max-w-2xl mx-auto space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-5 w-32 bg-slate-200 rounded-lg" />
          <div className="h-3 w-20 bg-slate-100 rounded-md" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-9 bg-slate-200 rounded-xl" />
          <div className="h-9 w-9 bg-blue-100 rounded-xl" />
        </div>
      </div>
      <div className="h-32 bg-white rounded-2xl border border-slate-100 shadow-sm" />
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-white rounded-2xl border border-slate-100 shadow-sm" />)}
      </div>
    </div>
  );
}
