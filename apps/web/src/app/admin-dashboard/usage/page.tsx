'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { BarChart } from '@mui/x-charts/BarChart';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

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

// Mapping of known Google Maps Platform services to their monthly free tier limits (Essentials/Pro SKU)
// Note: 'Routes API' is set to 5,000 because our backend uses 'TRAFFIC_AWARE' (Pro SKU)
// Most other core services (Geocoding, Places, etc.) have 10,000 free calls in Essentials.
const FREE_TIER_LIMITS: Record<string, number | null> = {
    'places-backend.googleapis.com': 10000,      // Places API (New)
    'routes.googleapis.com': 5000,               // Routes API (Pro SKU - Traffic Aware)
    'geocoding-backend.googleapis.com': 10000,   // Geocoding API
    'maps-backend.googleapis.com': 10000,        // Maps JavaScript API (Dynamic Maps)
    'directions-backend.googleapis.com': 10000,  // Directions API (Legacy)
    'distance-matrix-backend.googleapis.com': 10000, // Distance Matrix API (Legacy)
    'elevation-backend.googleapis.com': 10000,   // Elevation API
    'timezone-backend.googleapis.com': 10000,    // Time Zone API
    'monitoring.googleapis.com': 1000000,        // Cloud Monitoring API (1M free calls)
    'cloudaicompanion.googleapis.com': null,     // Gemini for Google Cloud (Subscription/Trial)
};

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
                        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                    },
                    credentials: 'include'
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

    // Process data for the chart and table
    const processedData = useMemo(() => {
        return data.map(s => {
            const total = s.points.reduce((sum, p) => sum + p.count, 0);
            
            // Check if service exists in our limit map
            const limitEntry = Object.entries(FREE_TIER_LIMITS).find(([key]) => s.service.includes(key));
            const limitValue = limitEntry ? limitEntry[1] : undefined;
            
            const hasLimit = limitValue !== undefined && limitValue !== null;
            const displayLimit = hasLimit ? limitValue?.toLocaleString() : (limitValue === null ? 'Subscription' : 'Check Console');
            const isOverLimit = hasLimit ? total > (limitValue as number) : false;

            return {
                rawService: s.service,
                serviceName: s.service.replace('.googleapis.com', ''),
                total,
                limit: displayLimit,
                isOverLimit
            };
        }).filter(d => d.total > 0).sort((a, b) => b.total - a.total);
    }, [data]);

    if (loading) {
        return (
            <PageContainer>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                    <CircularProgress />
                </Box>
            </PageContainer>
        );
    }

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
                        {processedData.length > 0 ? (
                            <BarChart
                                dataset={processedData}
                                xAxis={[{ scaleType: 'band', dataKey: 'serviceName' }]}
                                series={[{ dataKey: 'total', label: 'Total Requests', color: '#1976d2' }]}
                                height={300}
                                margin={{ top: 20, bottom: 30, left: 40, right: 10 }}
                            />
                        ) : (
                            <Typography color="text.secondary">No usage data found for the selected period.</Typography>
                        )}
                    </CardContent>
                </Card>

                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="h6" gutterBottom>Free Tier Usage Status</Typography>
                        <TableContainer component={Paper} elevation={0} variant="outlined">
                            <Table sx={{ minWidth: 650 }} aria-label="api usage table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>API Name</TableCell>
                                        <TableCell align="right">Requests (Last 30 Days)</TableCell>
                                        <TableCell align="right">Monthly Free Tier Limit</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {processedData.map((row) => (
                                        <TableRow
                                            key={row.rawService}
                                            sx={{ 
                                                '&:last-child td, &:last-child th': { border: 0 },
                                                backgroundColor: row.isOverLimit ? 'error.lighter' : 'inherit'
                                            }}
                                        >
                                            <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                                                {row.serviceName}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography 
                                                    color={row.isOverLimit ? 'error.main' : 'text.primary'}
                                                    fontWeight={row.isOverLimit ? 'bold' : 'regular'}
                                                >
                                                    {row.total.toLocaleString()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: 'text.secondary' }}>
                                                {row.limit}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {processedData.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                                                No usage data available to display.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>

                <Typography variant="body2" color="text.secondary">
                    Note: Metrics are updated every 1-4 hours by Google Cloud. For detailed real-time billing, please visit the Google Cloud Console.
                </Typography>
            </Stack>
        </PageContainer>
    );
}
