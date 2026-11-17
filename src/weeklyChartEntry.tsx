import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  WeeklyAttendanceChart,
  type WeeklyChartPayload,
} from './components/WeeklyAttendanceChart';

declare global {
  interface Window {
    __PASUNDAN9_CHART_PAYLOAD__?: WeeklyChartPayload;
    __PASUNDAN9_REFRESH_WEEKLY_CHART__?: () => void;
    __PASUNDAN9_SWITCH_TAB__?: (tab: 'presensi' | 'enrollment' | 'config') => void;
  }
}

const DEFAULT_PAYLOAD: WeeklyChartPayload = {
  isDark: typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : true,
  supabaseConnected: false,
  loading: false,
  error: null,
  roleFilter: 'ALL',
  classFilter: 'ALL',
  totalStudents: 0,
  days: [],
};

function WeeklyChartHost() {
  const [payload, setPayload] = useState<WeeklyChartPayload>(
    () => window.__PASUNDAN9_CHART_PAYLOAD__ ?? DEFAULT_PAYLOAD
  );

  useEffect(() => {
    if (window.__PASUNDAN9_CHART_PAYLOAD__) {
      setPayload(window.__PASUNDAN9_CHART_PAYLOAD__);
    }

    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<WeeklyChartPayload>;
      if (customEvent.detail) {
        setPayload(customEvent.detail);
      }
    };

    window.addEventListener('pasundan9:weekly-chart-update', handleUpdate);
    return () => {
      window.removeEventListener('pasundan9:weekly-chart-update', handleUpdate);
    };
  }, []);

  return (
    <WeeklyAttendanceChart
      data={payload}
      onRefresh={() => {
        window.__PASUNDAN9_REFRESH_WEEKLY_CHART__?.();
      }}
      onNavigateTab={(tab) => {
        window.__PASUNDAN9_SWITCH_TAB__?.(tab);
      }}
    />
  );
}

const mountEl = document.getElementById('weeklyAttendanceChartRoot');
if (mountEl) {
  createRoot(mountEl).render(
    <React.StrictMode>
      <WeeklyChartHost />
    </React.StrictMode>
  );
}
