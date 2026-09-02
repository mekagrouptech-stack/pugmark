import * as XLSX from 'xlsx'

/**
 * Attendance → Excel export.
 *
 * Exports exactly the rows the table is showing — filters, search and date
 * range included — because the sheet is nearly always produced to answer the
 * question already on screen. Exporting the unfiltered set instead would
 * quietly hand back a different answer than the one being looked at.
 *
 * The column headers match the importer's expected names, so a sheet exported
 * here can be edited and fed straight back through Import without renaming
 * anything.
 */

// Headers double as the import contract — see backend HEADER_ALIASES.
const COLUMNS = [
  { header: 'Employee Name', key: 'employeeName', width: 26 },
  { header: 'Employee Code', key: 'employeeCode', width: 16 },
  { header: 'Date', key: 'date', width: 14 },
  { header: 'Check In', key: 'checkIn', width: 12 },
  { header: 'Check Out', key: 'checkOut', width: 12 },
  { header: 'Total Hours', key: 'totalHours', width: 13 },
  { header: 'Status', key: 'status', width: 12 },
]

/**
 * Dates go out as DD/MM/YYYY to match how the app displays them everywhere
 * else. They are written as text, not as Excel date cells, so the value cannot
 * be re-interpreted as MM/DD by a spreadsheet in a different locale — the one
 * failure mode that silently corrupts a re-import.
 */
const formatDateCell = (value) => {
  if (!value) return ''
  const parts = String(value).slice(0, 10).split('-')
  if (parts.length === 3 && parts[0].length === 4) {
    const [year, month, day] = parts
    return `${day}/${month}/${year}`
  }
  return String(value)
}

const cleanTime = (value) => {
  if (!value || value === '-' || value === '--:--') return ''
  return String(value)
}

/**
 * Build and download an .xlsx of the given attendance rows.
 *
 * @param {Array<Object>} rows      rows as rendered by the table
 * @param {Object}        [options]
 * @param {string}        [options.fileName] base name, without extension
 * @param {string}        [options.sheetName]
 * @returns {number} how many rows were written
 */
export function exportAttendanceToExcel(rows, options = {}) {
  const { fileName = 'attendance', sheetName = 'Attendance' } = options
  const list = Array.isArray(rows) ? rows : []

  const data = list.map((row) => ({
    'Employee Name': row.employeeName || '',
    'Employee Code': row.employeeCode || '',
    Date: formatDateCell(row.date),
    'Check In': cleanTime(row.checkIn),
    'Check Out': cleanTime(row.checkOut),
    'Total Hours': row.totalHours || '0h 00m',
    Status: row.status || '',
  }))

  // A header-only sheet is still worth producing: it doubles as a blank
  // template, and an empty file is a clearer answer than a silent no-op.
  const sheet = data.length
    ? XLSX.utils.json_to_sheet(data)
    : XLSX.utils.aoa_to_sheet([COLUMNS.map((c) => c.header)])

  sheet['!cols'] = COLUMNS.map((c) => ({ wch: c.width }))
  sheet['!autofilter'] = { ref: XLSX.utils.encode_range({
    s: { c: 0, r: 0 },
    e: { c: COLUMNS.length - 1, r: Math.max(data.length, 1) },
  }) }

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName)

  // Stamp the filename so repeated exports do not overwrite each other in the
  // downloads folder.
  const now = new Date()
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')

  XLSX.writeFile(workbook, `${fileName}-${stamp}.xlsx`)
  return data.length
}

/** Save a Blob the server sent (used for the import template). */
export function saveBlob(blob, fileName) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export default { exportAttendanceToExcel, saveBlob }
