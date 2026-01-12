import { MetricServiceClient } from '@google-cloud/monitoring';

const client = new MetricServiceClient();

export const getGoogleApiMetrics = async (projectId: string, days: number = 30) => {
  const now = new Date();
  const startTime = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // We are interested in Google Maps Platform APIs
  // These are typically under services like:
  // maps-backend.googleapis.com
  // places-backend.googleapis.com
  // routes.googleapis.com
  
  const request = {
    name: client.projectPath(projectId),
    filter: 'metric.type="serviceruntime.googleapis.com/api/request_count" AND resource.type="consumed_api"',
    interval: {
      startTime: {
        seconds: Math.floor(startTime.getTime() / 1000),
      },
      endTime: {
        seconds: Math.floor(now.getTime() / 1000),
      },
    },
    aggregation: {
      alignmentPeriod: {
        seconds: 24 * 60 * 60, // 1 day granularity
      },
      perSeriesAligner: 'ALIGN_SUM',
      crossSeriesReducer: 'REDUCE_SUM',
      groupByFields: ['resource.label.service'],
    },
  };

  try {
    const [timeSeries] = await client.listTimeSeries(request as any);
    
    // Transform to a format the frontend can easily consume
    const formattedData = timeSeries.map((series: any) => {
      const service = series.resource?.labels?.service || 'unknown';
      const points = series.points?.map((p: any) => ({
        date: new Date(Number(p.interval?.startTime?.seconds) * 1000).toISOString().split('T')[0],
        count: Number(p.value?.int64Value || 0)
      })) || [];

      return {
        service,
        points
      };
    });

    return formattedData;
  } catch (error) {
    console.error('Error fetching Google Cloud Metrics:', error);
    throw error;
  }
};
