'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import {
  BarChart2,
  ArrowLeft,
  Sparkles,
  DollarSign,
  Cpu,
  Layers,
} from 'lucide-react';

export default function AIUsagePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/ai/usage');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const { totalTokens = 0, totalCostUsd = 0, records = [] } = data || {};

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Link href="/admin/studio" className="text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-4 h-4 inline mr-1" />
            AI Studio
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart2 className="w-7 h-7 text-emerald-600" />
          AI Token Usage & Cost Analytics
        </h1>
        <p className="text-sm text-slate-500">
          Monitor token expenditure, provider requests, and cost accounting across AI generation pipelines.
        </p>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Total Tokens Consumed</div>
              <div className="text-2xl font-bold text-slate-900">{totalTokens.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Estimated Cost (USD)</div>
              <div className="text-2xl font-bold text-slate-900">${totalCostUsd.toFixed(4)}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Total AI Invocations</div>
              <div className="text-2xl font-bold text-slate-900">{records.length}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle>AI Invocation Ledger</CardTitle>
          <CardDescription>Granular audit history of prompts, completions, and token costs.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task Type</TableHead>
                <TableHead>Provider & Model</TableHead>
                <TableHead>Input Tokens</TableHead>
                <TableHead>Output Tokens</TableHead>
                <TableHead>Total Tokens</TableHead>
                <TableHead>Cost (USD)</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                    Loading usage records...
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableEmpty
                  colSpan={7}
                  title="No AI usage recorded yet"
                  description="When you generate course outlines or transform content, token records will appear here."
                />
              ) : (
                records.map((r) => (
                  <TableRow key={r._id}>
                    <TableCell>
                      <span className="font-semibold text-slate-800 text-xs">{r.taskType}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {r.provider} ({r.model})
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-slate-600">
                      {r.inputTokens?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-slate-600">
                      {r.outputTokens?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell className="text-xs font-mono font-bold text-slate-900">
                      {r.totalTokens?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-emerald-700 font-semibold">
                      ${r.estimatedCostUsd ? r.estimatedCostUsd.toFixed(6) : '0.000000'}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {new Date(r.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

