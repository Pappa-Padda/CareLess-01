'use client';

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { BarChart } from '@mui/x-charts/BarChart';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';

import PageContainer from '@/components/shared/ui/PageContainer';
import PageHeading from '@/components/shared/ui/PageHeading';
import BackButton from '@/components/shared/ui/BackButton';

interface MetricPoint {
    date: string;
    count: number;
}

interface ServiceMetric {
    service: string;
    points: MetricPoint[];
}

export default function ApiUsagePage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<ServiceMetric[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                const response = await fetch(`${apiUrl}/admin/google-stats`, {
                    headers: { 
                        'Content-Type': 'application/json',
                        // Include credentials if you use cookies for auth
                        'Authorization': `Bearer ${localStorage.getItem('token') || ''}` // Or relies on httpOnly cookies
                    },
                    credentials: 'include' // Important for cookies
                });
                if (!response.ok) throw new Error('Failed to fetch usage data');
                const result = await response.json();
                setData(result);
            } catch (err) {
                console.error(err);
                setError('Could not load Google API usage statistics. Ensure your backend has the GOOGLE_CLOUD_PROJECT_ID set and credentials configured.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <PageContainer>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                    <CircularProgress />
                </Box>
            </PageContainer>
        );
    }

    // Process data for the chart
    // We want a bar chart where X-axis is the Service Name and Y-axis is the total count for the period
    const chartData = data.map(s => ({
        service: s.service.replace('.googleapis.com', ''),
        total: s.points.reduce((sum, p) => sum + p.count, 0)
    })).filter(d => d.total > 0);

    return (
        <PageContainer>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 3 }}>
                <BackButton href="/admin-dashboard" tooltip="Back to Dashboard" sx={{ mt: 0.5 }} />
                <Box>
                    <PageHeading>Google Maps API Usage</PageHeading>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                        Official usage metrics pulled from Google Cloud Monitoring (Last 30 Days)
                    </Typography>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Stack spacing={3}>
                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="h6" gutterBottom>Total Requests by Service</Typography>
                        {chartData.length > 0 ? (
                            <BarChart
                                dataset={chartData}
                                xAxis={[{ scaleType: 'band', dataKey: 'service' }]}
                                series={[{ dataKey: 'total', label: 'Total Requests', color: '#1976d2' }]}
                                height={300}
                                margin={{ top: 20, bottom: 30, left: 40, right: 10 }}
                            />
                        ) : (
                            <Typography color="text.secondary">No usage data found for the selected period.</Typography>
                        )}
                    </CardContent>
                </Card>

                <Typography variant="body2" color="text.secondary">
                    Note: Metrics are updated every 1-4 hours by Google Cloud. For detailed real-time billing, please visit the Google Cloud Console.
                </Typography>
            </Stack>
        </PageContainer>
    );
}
