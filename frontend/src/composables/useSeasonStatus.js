import { computed } from 'vue'

// Takes both reports (for active/watch detection) and stats (for first-year detection).
export function useSeasonStatus(reports, stats) {
  const status = computed(() => {
    const month = new Date().getMonth() + 1; // 1-indexed
    const inSeasonWindow = month >= 5 && month <= 7; // May–July
    const hasRecentReports = reports.value.length > 0;

    if (inSeasonWindow && hasRecentReports) return 'ACTIVE';
    if (inSeasonWindow && !hasRecentReports) return 'WATCH';
    return 'DORMANT';
  });

  // True if the DB has never had a full season of reports.
  // The stats route returns last_season_total_reports as 0 (or null) if last season
  // had no data – that's the signal that this is still year one.
  const isFirstYear = computed(() => {
    return !stats.value || !stats.value.last_season_total_reports;
  });

  return { status, isFirstYear };
}
