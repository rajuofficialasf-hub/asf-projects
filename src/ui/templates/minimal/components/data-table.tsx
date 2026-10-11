import type { DataTableProps } from '@/ui/contract';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableContainer from '@mui/material/TableContainer';

import { EmptyState, LoadingState } from './states';

// ----------------------------------------------------------------------

export function DataTable<Row>({
  label,
  rows,
  columns,
  getRowId,
  loading,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
}: DataTableProps<Row>) {
  const renderBody = () => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={columns.length}>
            <LoadingState />
          </TableCell>
        </TableRow>
      );
    }
    if (!rows.length) {
      return (
        <TableRow>
          <TableCell colSpan={columns.length}>
            <EmptyState title={emptyTitle} description={emptyDescription} />
          </TableCell>
        </TableRow>
      );
    }
    return rows.map((row) => (
      <TableRow key={getRowId(row)} hover>
        {columns.map((column) => (
          <TableCell key={column.id} align={column.align}>
            {column.cell(row)}
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  return (
    <Card>
      <TableContainer>
        <Table aria-label={label} aria-busy={loading || undefined}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.id} align={column.align}>
                  {column.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>{renderBody()}</TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}
