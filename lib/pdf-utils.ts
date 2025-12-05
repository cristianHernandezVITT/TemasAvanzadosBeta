export async function exportTablePDF(title: string, headers: string[], rows: string[][], filename?: string, orientation: 'landscape' | 'portrait' = 'landscape') {
  const { default: jsPDF } = await import('jspdf')
  const pdf = new jsPDF(orientation, 'mm', 'a4')

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 14
  let y = 20

  // Title and date
  pdf.setFontSize(14)
  pdf.text(title, margin, y)
  pdf.setFontSize(9)
  pdf.text(new Date().toLocaleString(), pageWidth - margin, y, { align: 'right' })
  y += 8

  const usableWidth = pageWidth - margin * 2
  const colCount = headers.length || 1
  const colWidth = usableWidth / colCount
  const headerHeight = 8
  const bottomMargin = 16

  const lineHeight = 4.5 // mm per text line approximation

  const drawHeader = () => {
    pdf.setFillColor(245, 245, 245)
    pdf.setDrawColor(200)
    pdf.rect(margin, y, usableWidth, headerHeight, 'FD')
    pdf.setFontSize(9)
    pdf.setTextColor(30)
    let x = margin
    for (let i = 0; i < headers.length; i++) {
      const h = String(headers[i])
      const wrapped = pdf.splitTextToSize(h, colWidth - 4)
      pdf.text(wrapped, x + 2, y + 6)
      x += colWidth
    }
    y += headerHeight + 2
  }

  drawHeader()

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]
    // compute row height
    let maxLines = 1
    for (let c = 0; c < row.length; c++) {
      const cell = row[c] == null ? '' : String(row[c])
      const lines = pdf.splitTextToSize(cell, colWidth - 4)
      if (lines.length > maxLines) maxLines = lines.length
    }
    const rowHeight = Math.max(6, maxLines * lineHeight + 4)

    if (y + rowHeight > pageHeight - bottomMargin) {
      pdf.addPage()
      y = 20
      drawHeader()
    }

    let x = margin
    pdf.setFontSize(9)
    pdf.setTextColor(20)
    for (let c = 0; c < headers.length; c++) {
      const cell = row[c] == null ? '' : String(row[c])
      const lines = pdf.splitTextToSize(cell, colWidth - 4)
      pdf.text(lines, x + 2, y + 6)
      pdf.setDrawColor(220)
      pdf.rect(x, y, colWidth, rowHeight)
      x += colWidth
    }
    y += rowHeight
  }

  // Footer with page numbers
  const totalPages = pdf.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p)
    pdf.setFontSize(8)
    pdf.setTextColor(120)
    pdf.text(`Página ${p} / ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' })
  }

  const name = filename || `${title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`
  pdf.save(name)
}
