/**
 * Attendance Tab Screen
 */

import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Loading } from '@/components/ui/Loading';

export default function AttendanceScreen() {
  const router = useRouter();

  useEffect(() => {
    // Manual punch removed — attendance now comes from the biometric device.
    // Show the attendance records list instead.
    router.replace('/attendance/list');
  }, []);

  return <Loading message="Loading..." />;
}
