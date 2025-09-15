import { Metric } from 'web-vitals';

const reportWebVitals = async (onPerfEntry?: (metric: Metric) => void): Promise<void> => {
  if (!onPerfEntry || !(onPerfEntry instanceof Function)) {
    return;
  }

  try {
    const { onCLS, onFID, onFCP, onLCP, onTTFB } = await import('web-vitals');

    // Register all web vital measurements
    const vitals = [
      onCLS,
      onFID,
      onFCP,
      onLCP,
      onTTFB
    ];

    vitals.forEach(metric => metric(onPerfEntry));
  } catch (error) {
    console.warn('Failed to load web-vitals:', error);
  }
};

export default reportWebVitals;