import { ref, onMounted } from 'vue'
import { getReports } from '../utils/api'

export function useReports() {
  const reports = ref([]);
  const loading = ref(false);
  const error = ref(null);

  async function fetchReports() {
    loading.value = true;
    error.value = null;
    try {
      reports.value = await getReports();
    } catch (err) {
      error.value = err.message;
      console.error('Failed to fetch reports:', err);
    } finally {
      loading.value = false;
    }
  }

  onMounted(async () => {
    await fetchReports();
  });

  return { reports, loading, error, fetchReports };
}
