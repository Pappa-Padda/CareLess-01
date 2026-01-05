import * as React from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

export interface Column<T> {
  id: keyof T | 'actions';
  label: string;
  align?: 'right' | 'left' | 'center';
  width?: number | string;
}

interface CustomTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading: boolean;
  emptyMessage?: string;
  renderCell: (item: T, column: Column<T>) => React.ReactNode;
}

export default function CustomTable<T extends { id: React.Key }>({
  columns,
  data,
  isLoading,
  emptyMessage = 'No items to display.',
  renderCell,
}: CustomTableProps<T>) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table sx={{ minWidth: 650 }} aria-label="custom table">
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={String(column.id)} align={column.align} width={column.width}>
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                <Typography color="text.secondary">{emptyMessage}</Typography>
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow
                key={item.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                {columns.map((column) => (
                  <TableCell key={String(column.id)} align={column.align}>
                    {renderCell(item, column)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
