import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, CalendarDays, RefreshCw, TrendingUp, Users } from 'lucide-react';

export type AttendanceRoleFilter = 'ALL' | 'siswa' | 'guru';

export interface WeeklyDayStat {
  date: string;
  dayShort: string;
  dateShort: string;
  axisLabel: string;
  fullDateLabel: string;
  hadir: number;
  belumHadir: number;
  totalSiswa: number;
  persentase: number;
}

export interface WeeklyChartPayload {
  isDark: boolean;
  supabaseConnected: boolean;
  loading: boolean;
  error: string | null;
  roleFilter?: AttendanceRoleFilter;
  classFilter: string;
  totalStudents: number;
  days: WeeklyDayStat[];
}

interface WeeklyAttendanceChartProps {
  data: WeeklyChartPayload;
  onRefresh: () => void;
  onNavigateTab: (tab: 'presensi' | 'enrollment' | 'config') => void;
}

type ChartViewMode = 'count' | 'percent';

interface TooltipItem {
  payload?: WeeklyDayStat;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipItem[];
  isDark: boolean;
  unitLabel: string;
}

function ChartTooltip({ active, payload, isDark, unitLabel }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0 || !payload[0]?.payload) {
    return null;
  }

  const row = payload[0].payload;

  return (
    <div
      className={`rounded-xl border px-3.5 py-2.5 shadow-xl text-xs min-w-[195px] ${
        isDark
          ? 'bg-slate-900/95 border-slate-700 text-slate-100'
          : 'bg-white/95 border-slate-200 text-slate-900'
      }`}
    >
      <div className="font-semibold text-xs mb-2 pb-1.5 border-b border-slate-200 dark:border-slate-800">
        {row.fullDateLabel}
      </div>
      <div className="space-y-1.5 font-mono tabular-nums">
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1.5 font-sans text-slate-600 dark:text-slate-300">
            <span className="w-2 h-2 rounded-xs bg-emerald-500 inline-block" />
            Hadir
          </span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {row.hadir} {unitLabel}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1.5 font-sans text-slate-600 dark:text-slate-300">
            <span className="w-2 h-2 rounded-xs bg-slate-400 dark:bg-slate-600 inline-block" />
            Belum Hadir
          </span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {row.belumHadir} {unitLabel}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-200 dark:border-slate-800">
          <span className="font-sans text-slate-500 dark:text-slate-400">Tingkat Kehadiran</span>
          <span className="font-bold text-amber-600 dark:text-amber-400">{row.persentase}%</span>
        </div>
      </div>
    </div>
  );
}

export const WeeklyAttendanceChart: React.FC<WeeklyAttendanceChartProps> = ({
  data,
  onRefresh,
  onNavigateTab,
}) => {
  const [viewMode, setViewMode] = useState<ChartViewMode>('count');

  const roleFilter: AttendanceRoleFilter = data.roleFilter ?? 'ALL';

  const summary = useMemo(() => {
    const days = data.days || [];
    if (days.length === 0) {
      return {
        avgRate: 0,
        totalPresentWeek: 0,
        peakDayLabel: '—',
        peakRate: 0,
      };
    }

    const totalPresentWeek = days.reduce((acc, d) => acc + d.hadir, 0);
    const activeDays = days.filter((d) => d.hadir > 0);
    const avgBase = activeDays.length > 0 ? activeDays : days;
    const avgRate = Math.round(
      avgBase.reduce((acc, d) => acc + d.persentase, 0) / avgBase.length
    );

    let peak = days[0];
    for (const d of days) {
      if (d.hadir > peak.hadir || (d.hadir === peak.hadir && d.persentase > peak.persentase)) {
        peak = d;
      }
    }

    return {
      avgRate,
      totalPresentWeek,
      peakDayLabel: peak.hadir > 0 ? `${peak.dayShort} (${peak.persentase}%)` : '—',
      peakRate: peak.persentase,
    };
  }, [data.days]);

  const roleLabel =
    roleFilter === 'guru'
      ? 'Khusus Guru'
      : roleFilter === 'siswa'
        ? 'Khusus Siswa'
        : 'Siswa & Guru';

  const unitLabel =
    roleFilter === 'guru' ? 'guru' : roleFilter === 'siswa' ? 'siswa' : 'orang';

  const classScopeLabel =
    data.classFilter && data.classFilter !== 'ALL'
      ? `${roleLabel} · ${data.classFilter}`
      : `${roleLabel} · Semua Kelas / Unit`;

  const gridStroke = data.isDark ? '#1e293b' : '#e2e8f0';
  const tickColor = data.isDark ? '#94a3b8' : '#64748b';
  const hadirFill = data.isDark ? '#10b981' : '#15803d';
  const absentFill = data.isDark ? '#334155' : '#cbd5e1';
  const lineStroke = data.isDark ? '#fbbf24' : '#d97706';

  return (
    <div className="bg-white dark:bg-[#0B1220] border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gradient-to-r from-white to-slate-50/70 dark:from-[#0B1220] dark:to-[#0F182B]">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-pasundan-50 dark:bg-emerald-500/15 border border-pasundan-100 dark:border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <BarChart3 className="w-4 h-4 text-pasundan-700 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Grafik Ringkasan Kehadiran Mingguan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pantauan tren 7 hari terakhir (WIB) · Cakupan:{' '}
              <span className="font-medium text-slate-700 dark:text-emerald-300">
                {classScopeLabel}
              </span>
            </p>
          </div>
        </div>

        {/* Mode Toggle + Refresh */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div
            className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-lg"
            role="group"
            aria-label="Mode Tampilan Grafik"
          >
            <button
              type="button"
              onClick={() => setViewMode('count')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                viewMode === 'count'
                  ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {roleFilter === 'guru'
                ? 'Jumlah Guru'
                : roleFilter === 'siswa'
                  ? 'Jumlah Siswa'
                  : 'Jumlah Hadir'}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('percent')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                viewMode === 'percent'
                  ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Persentase (%)
            </button>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={!data.supabaseConnected || data.loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent dark:border-slate-700 disabled:opacity-50 rounded-lg transition-colors min-h-[34px] whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${data.loading ? 'animate-spin' : ''}`} />
            <span>Perbarui</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5">
        {/* 3 Weekly KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Rata-rata Kehadiran
              </div>
              <div className="mt-1 font-display text-xl font-bold tabular-nums text-slate-900 dark:text-emerald-400">
                {data.supabaseConnected ? `${summary.avgRate}%` : '—'}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-emerald-500/30 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-pasundan-700 dark:text-emerald-400" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Total Kehadiran (7 Hari)
              </div>
              <div className="mt-1 font-display text-xl font-bold tabular-nums text-slate-900 dark:text-white">
                {data.supabaseConnected ? summary.totalPresentWeek : '—'}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Puncak Kehadiran
              </div>
              <div className="mt-1 font-display text-lg sm:text-xl font-bold tabular-nums text-amber-600 dark:text-amber-400 truncate">
                {data.supabaseConnected ? summary.peakDayLabel : '—'}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-amber-500/30 flex items-center justify-center shrink-0">
              <CalendarDays className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>

        {/* Chart Area / Empty / Error States */}
        {!data.supabaseConnected ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Grafik Mingguan Menunggu Koneksi Supabase
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Hubungkan proyek Supabase sekolah pada tab Konfigurasi Supabase untuk menampilkan rekap kehadiran 7 hari terakhir secara otomatis.
            </p>
            <button
              type="button"
              onClick={() => onNavigateTab('config')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-pasundan-700 hover:bg-pasundan-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg transition-colors"
            >
              Buka Konfigurasi Supabase
            </button>
          </div>
        ) : data.error ? (
          <div className="rounded-xl border border-red-200 dark:border-red-500/40 bg-red-50 dark:bg-red-950/50 px-5 py-6 text-center space-y-3">
            <p className="text-xs text-red-800 dark:text-red-200">{data.error}</p>
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Coba Muat Ulang
            </button>
          </div>
        ) : data.totalStudents === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Belum Ada Data {roleFilter === 'guru' ? 'Guru' : roleFilter === 'siswa' ? 'Siswa' : 'Siswa & Guru'} untuk Digrafikkan
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Daftarkan wajah siswa atau guru terlebih dahulu pada tab Pendaftaran Wajah agar grafik ringkasan kehadiran mingguan dapat dihitung.
            </p>
            <button
              type="button"
              onClick={() => onNavigateTab('enrollment')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-pasundan-700 hover:bg-pasundan-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg transition-colors"
            >
              Daftarkan Siswa / Guru
            </button>
          </div>
        ) : (
          <div className="w-full h-[290px]">
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === 'count' ? (
                <BarChart
                  data={data.days}
                  margin={{ top: 10, right: 12, left: -12, bottom: 4 }}
                  barGap={4}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="axisLabel"
                    tick={{ fill: tickColor, fontSize: 12 }}
                    axisLine={{ stroke: gridStroke }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: tickColor, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: data.isDark ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.04)' }}
                    content={<ChartTooltip isDark={data.isDark} unitLabel={unitLabel} />}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                    iconType="square"
                  />
                  <Bar
                    dataKey="hadir"
                    name="Hadir"
                    stackId="attendance"
                    fill={hadirFill}
                    radius={[0, 0, 4, 4]}
                    maxBarSize={44}
                  />
                  <Bar
                    dataKey="belumHadir"
                    name="Belum Hadir"
                    stackId="attendance"
                    fill={absentFill}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={44}
                  />
                </BarChart>
              ) : (
                <LineChart
                  data={data.days}
                  margin={{ top: 10, right: 16, left: -10, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="axisLabel"
                    tick={{ fill: tickColor, fontSize: 12 }}
                    axisLine={{ stroke: gridStroke }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    unit="%"
                    tick={{ fill: tickColor, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ stroke: gridStroke, strokeWidth: 1.5 }}
                    content={<ChartTooltip isDark={data.isDark} unitLabel={unitLabel} />}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="persentase"
                    name="Tingkat Kehadiran (%)"
                    stroke={lineStroke}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: hadirFill, stroke: lineStroke, strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: lineStroke, stroke: data.isDark ? '#0B1220' : '#ffffff', strokeWidth: 2 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
