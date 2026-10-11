import type { DataTableProps } from '@/ui/contract';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableFooter from '@mui/material/TableFooter';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import TableContainer from '@mui/material/TableContainer';
import { useTheme } from '@mui/material/styles';

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
  loadingLabel,
  cardsOnPhones,
  phoneColumns = columns,
  phoneFooter,
  dense,
}: DataTableProps<Row>) {
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down('sm'));

  if (cardsOnPhones && phone) {
    return (
      <Box aria-label={label} aria-busy={loading || undefined} role="region">
        {loading ? (
          <LoadingState label={loadingLabel} />
        ) : !rows.length ? (
          <Card>
            <EmptyState title={emptyTitle} description={emptyDescription} />
          </Card>
        ) : (
          <Box component="ul" sx={{ m: 0, p: 0, gap: 1.5, display: 'flex', flexDirection: 'column', listStyle: 'none' }}>
            {rows.map((row) => (
              <Card component="li" key={getRowId(row)} sx={{ p: 2 }}>
                <Box component="dl" sx={{ m: 0, gap: 1, display: 'grid', gridTemplateColumns: 'minmax(96px, auto) 1fr' }}>
                  {phoneColumns.map((column) => (
                    <Box key={column.id} sx={{ display: 'contents' }}>
                      <Typography component="dt" variant="caption" sx={{ color: 'text.secondary', pt: 0.25 }}>
                        {column.headerText ?? column.header}
                      </Typography>
                      <Typography component="dd" variant="body2" sx={{ m: 0, minWidth: 0, overflowWrap: 'anywhere' }}>
                        {column.cell(row)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Card>
            ))}
          </Box>
        )}
        {phoneFooter !== undefined && rows.length > 0 && <Box sx={{ mt: 1.5 }}>{phoneFooter}</Box>}
      </Box>
    );
  }

  const hasFooter = columns.some((column) => column.footer !== undefined);

  const renderBody = () => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={columns.length}>
            <LoadingState label={loadingLabel} />
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
        <Table aria-label={label} aria-busy={loading || undefined} size={dense ? 'small' : 'medium'}>
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
          {hasFooter && rows.length > 0 && (
            <TableFooter>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column.id} align={column.align} sx={{ fontWeight: 700, color: 'text.primary', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                    {column.footer}
                  </TableCell>
                ))}
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </TableContainer>
    </Card>
  );
}
