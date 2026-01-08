import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import TableSortLabel from '@mui/material/TableSortLabel';

export interface Column<T> {
  id: keyof T | 'actions';
  label: string;
  align?: 'right' | 'left' | 'center';
  width?: number | string;
  sortable?: boolean;
  format?: (value: unknown) => React.ReactNode;
}

interface CustomTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading: boolean;
  emptyMessage?: string;
  renderCell: (item: T, column: Column<T>) => React.ReactNode;
  sortConfig?: {
    key: keyof T | 'actions';
    direction: 'asc' | 'desc';
  };
  onSort?: (columnId: keyof T | 'actions') => void;
}

export default function CustomTable<T extends { id: React.Key }>({
  columns,
  data,
  isLoading,
  emptyMessage = 'No items to display.',
  renderCell,
  sortConfig,
  onSort,
}: CustomTableProps<T>) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table sx={{ minWidth: 650 }} aria-label="custom table">
        <TableHead sx={{ borderBottom: '2px solid', borderColor: 'divider' }}>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={String(column.id)}
                align={column.align}
                width={column.width}
                sortDirection={sortConfig?.key === column.id ? sortConfig.direction : false}
              >
                {column.sortable && onSort ? (
                  <TableSortLabel
                    active={sortConfig?.key === column.id}
                    direction={sortConfig?.key === column.id ? sortConfig.direction : 'asc'}
                    onClick={() => onSort(column.id)}
                  >
                    {column.label}
                  </TableSortLabel>
                ) : (
                  column.label
                )}
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
