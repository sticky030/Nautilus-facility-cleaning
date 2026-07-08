import jsPDF from 'jspdf'
import 'jspdf-autotable'

// ─── Nautilus Design-Token (dunkelblau + Cyan, druckfreundlich) ───
const INK    = [  6,  16,  31]   // #06101F  Kopfband, Tabellenkopf
const CYAN   = [  8, 145, 178]   // #0891B2  Akzent (Linien, Labels)
const CYAND  = [ 14, 116, 144]   // etwas dunkler fuer Text auf Weiss
const WHITE  = [255, 255, 255]
const PAPER  = [248, 250, 252]   // #F8FAFC  sehr helles Slate
const DARK   = [ 15,  23,  42]   // #0F172A  Text
const MUTED  = [100, 116, 139]   // #64748B
const BORDER = [226, 232, 240]   // #E2E8F0
const GREEN  = [ 16, 133,  86]
const RED    = [190,  40,  40]
const AMBER  = [180,  90,  10]

const PW = 210
const M  = 18

function fmtDate(d) {
  if (!d) return ''
  const [y, mo, day] = d.split('-')
  return `${day}.${mo}.${y}`
}

async function imgToBase64(url) {
  try {
    const r = await fetch(url)
    const b = await r.blob()
    return await new Promise(res => {
      const fr = new FileReader()
      fr.onloadend = () => res(fr.result)
      fr.readAsDataURL(b)
    })
  } catch { return null }
}

// Freigestelltes Logo einmalig laden (Fallback: Wortmarke im Kopf)
let LOGO
const LOGO_RATIO = 668 / 469 // Breite / Hoehe des freigestellten PNG
async function ensureLogo() {
  if (LOGO === undefined) LOGO = await imgToBase64('/nautilus-logo-transparent.png')
}

// Weisse Seite + heller Body
function bgPage(doc) {
  doc.setFillColor(...WHITE)
  doc.rect(0, 0, PW, 297, 'F')
}

// Sektions-Ueberschrift: Cyan-Marke + dunkler Text + Cyan-Unterlinie
function sectionTitle(doc, text, y) {
  doc.setFillColor(...CYAN)
  doc.rect(M, y - 2.4, 2.4, 2.6, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...DARK)
  doc.text(text, M + 5.5, y)
  doc.setDrawColor(...CYAN)
  doc.setLineWidth(0.6)
  doc.line(M, y + 2, PW - M, y + 2)
  return y + 9
}

// Linker Cyan-Balken (Notiz-/Hinweiskarten)
function leftBar(doc, x, y, h) {
  doc.setFillColor(...CYAN)
  doc.rect(x, y, 2.5, h, 'F')
}

// Gerahmter Info-Kopfblock mit Trennern (2..4 Spalten)
function infoPanel(doc, y, items) {
  const TW = PW - 2 * M
  const infoH = 25
  doc.setFillColor(...PAPER); doc.setDrawColor(...BORDER); doc.setLineWidth(0.3)
  doc.roundedRect(M, y, TW, infoH, 3, 3, 'FD')
  const icw = TW / items.length
  items.forEach((it, i) => {
    const x = M + i * icw + 8
    if (i > 0) { doc.setDrawColor(...BORDER); doc.setLineWidth(0.3); doc.line(M + i * icw, y + 4.5, M + i * icw, y + infoH - 4.5) }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(5.8); doc.setTextColor(...CYAND); doc.setCharSpace(0.4)
    doc.text(it[0], x, y + 7.5); doc.setCharSpace(0)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...DARK)
    doc.text(it[1] || 'k. A.', x, y + 14, { maxWidth: icw - 12 })
    if (it[2]) { doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...MUTED); doc.text(it[2], x, y + 19.5, { maxWidth: icw - 12 }) }
  })
  return y + infoH
}

// ─────────────────────────────────────────────────────────
// HEADER: dunkelblaues Band + Cyan-Kante
// ─────────────────────────────────────────────────────────
function drawHeader(doc, docTitle, datum, nr) {
  doc.setFillColor(...INK)
  doc.rect(0, 0, PW, 27, 'F')
  doc.setFillColor(...CYAN)
  doc.rect(0, 27, PW, 0.9, 'F')

  // Freigestelltes Logo, sonst Wortmarke als Fallback
  let logoDrawn = false
  if (LOGO) {
    const lh = 19.5, lw = lh * LOGO_RATIO
    try { doc.addImage(LOGO, 'PNG', M, (27 - lh) / 2, lw, lh); logoDrawn = true } catch { logoDrawn = false }
  }
  if (!logoDrawn) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(21); doc.setTextColor(...WHITE)
    doc.text('NAUTILUS', M, 14)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(103, 232, 249)
    doc.setCharSpace(2.4); doc.text('F A C I L I T Y   C L E A N I N G', M, 19.5); doc.setCharSpace(0)
  }

  // Titel + Nummer rechts
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...WHITE)
  doc.text(docTitle.toUpperCase(), PW - M, 13.5, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text(`${fmtDate(datum)}   |   ${nr}`, PW - M, 19.5, { align: 'right' })
}

// ─────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────
function drawFooter(doc, pageNum, totalPages) {
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.3)
  doc.line(M, 282, PW - M, 282)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(...MUTED)
  doc.text('Nautilus Facility Cleaning  ·  Berlin  ·  kontakt@nautilus-facility.de  ·  nautilus-facility.de', M, 287)
  doc.setTextColor(...CYAND)
  doc.setFont('helvetica', 'bold')
  doc.text(`${pageNum} / ${totalPages}`, PW - M, 287, { align: 'right' })
}

// ─────────────────────────────────────────────────────────
// PROTOKOLL PDF
// ─────────────────────────────────────────────────────────
export async function generateProtocolPDF({
  objekt, datum, zeitVon, zeitBis, mitarbeiter,
  bereiche, gesamtNotizen, maengel,
  nummer = null, signatureDataURL, fotoUrls = []
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const nr  = nummer || `NFD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900 + 100))}`
  await ensureLogo()

  bgPage(doc)
  drawHeader(doc, 'Reinigungsprotokoll', datum, nr)

  let y = 38

  // Kopfblock: gerahmter Info-Panel
  y = infoPanel(doc, y, [
    ['OBJEKT', objekt?.name || 'k. A.', objekt?.adresse || ''],
    ['EINSATZ', fmtDate(datum), zeitVon && zeitBis ? `${zeitVon} bis ${zeitBis} Uhr` : ''],
    ['MITARBEITER', mitarbeiter || 'k. A.', ''],
    ['PROTOKOLL-NR', nr, ''],
  ]) + 13

  // Reinigungsbereiche
  y = sectionTitle(doc, 'REINIGUNGSBEREICHE', y)
  const labels = {
    eingang: 'Eingangsbereich / Haustür', treppenhaus: 'Treppenhaus', aufzug: 'Aufzug / Fahrstuhl',
    keller: 'Keller / Kellergang', muellraum: 'Müllraum', fahrradraum: 'Fahrradraum',
    aussenanlage: 'Außenanlage / Gehweg', tiefgarage: 'Tiefgarage / Stellplätze',
    waschraum: 'Wasch- / Trockenraum', dachboden: 'Dachboden / Gemeinschaftsraum',
  }
  const rows = Object.entries(bereiche).map(([key, val]) => [
    labels[key] || key,
    val.erledigt ? 'Gereinigt' : 'Nicht erledigt',
    val.notiz || '',
  ])

  doc.autoTable({
    startY: y,
    margin: { left: M, right: M },
    head: [['Bereich', 'Status', 'Anmerkung']],
    body: rows,
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 8.5, textColor: DARK,
      cellPadding: { top: 4.2, bottom: 4.2, left: 6, right: 6 },
      lineColor: BORDER, lineWidth: { top: 0, right: 0, bottom: 0.15, left: 0 } },
    headStyles: { fillColor: INK, textColor: WHITE, fontSize: 7, fontStyle: 'bold',
      cellPadding: { top: 4, bottom: 4, left: 6, right: 6 }, lineWidth: 0 },
    columnStyles: { 0: { cellWidth: 80, fontStyle: 'bold' }, 1: { cellWidth: 34, halign: 'center' }, 2: { cellWidth: 'auto' } },
    alternateRowStyles: { fillColor: [250, 251, 253] },
    didParseCell(d) {
      if (d.section === 'body' && d.column.index === 1) { d.cell.text = [''] }
      if (d.section === 'body' && d.column.index === 2) { d.cell.styles.textColor = MUTED; d.cell.styles.fontStyle = 'italic'; d.cell.styles.fontSize = 7.5 }
    },
    didDrawCell(d) {
      if (d.section === 'body' && d.column.index === 1) {
        const ok = d.row.raw[1] === 'Gereinigt'
        const label = ok ? 'Erledigt' : 'Offen'
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
        const tw = doc.getTextWidth(label)
        const P = 4.6, dotR = 1.05, gap = 2.4, ph = 5.8
        const pw = P + dotR * 2 + gap + tw + P
        const bx = d.cell.x + (d.cell.width - pw) / 2
        const by = d.cell.y + (d.cell.height - ph) / 2
        const midY = by + ph / 2
        doc.setFillColor(...(ok ? [236, 253, 245] : [254, 243, 226]))
        doc.roundedRect(bx, by, pw, ph, ph / 2, ph / 2, 'F')
        // Punkt und Text beide exakt auf die Pillenmitte zentriert
        doc.setFillColor(...(ok ? GREEN : AMBER))
        doc.circle(bx + P + dotR, midY, dotR, 'F')
        doc.setTextColor(...(ok ? GREEN : AMBER))
        doc.text(label, bx + P + dotR * 2 + gap, midY, { baseline: 'middle' })
      }
    },
    didAddPage() { bgPage(doc); drawHeader(doc, 'Reinigungsprotokoll', datum, nr) },
  })
  y = doc.lastAutoTable.finalY + 12

  // Maengel
  if (maengel?.trim()) {
    if (y > 238) { doc.addPage(); bgPage(doc); drawHeader(doc, 'Reinigungsprotokoll', datum, nr); y = 38 }
    y = sectionTitle(doc, 'MÄNGEL / BESONDERHEITEN', y)
    const lines = doc.splitTextToSize(maengel, PW - M * 2 - 14)
    const bh = lines.length * 5.5 + 12
    doc.setFillColor(254, 246, 246); doc.setDrawColor(232, 200, 200); doc.setLineWidth(0.3)
    doc.roundedRect(M, y, PW - M * 2, bh, 2, 2, 'FD')
    doc.setFillColor(...RED); doc.rect(M, y, 2.5, bh, 'F')
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(150, 35, 35)
    doc.text(lines, M + 8, y + 7.5)
    y += bh + 12
  }

  // Notizen: freies Feld fuer handschriftliche Vermerke
  {
    const bh = 34
    if (y > 250 - bh) { doc.addPage(); bgPage(doc); drawHeader(doc, 'Reinigungsprotokoll', datum, nr); y = 38 }
    y = sectionTitle(doc, 'NOTIZEN', y)
    doc.setFillColor(...WHITE); doc.setDrawColor(...BORDER); doc.setLineWidth(0.3)
    doc.roundedRect(M, y, PW - M * 2, bh, 2, 2, 'FD')
    leftBar(doc, M, y, bh)
    // dezente Schreiblinien
    doc.setDrawColor(...BORDER); doc.setLineWidth(0.2)
    for (let ly = y + 11; ly < y + bh - 3; ly += 8) doc.line(M + 9, ly, PW - M - 7, ly)
    y += bh + 12
  }

  // Fotos
  if (fotoUrls.length > 0) {
    doc.addPage(); bgPage(doc); drawHeader(doc, 'Reinigungsprotokoll', datum, nr); y = 38
    y = sectionTitle(doc, `DOKUMENTATIONSFOTOS (${fotoUrls.length})`, y)
    const cols = 2
    const fw = (PW - M * 2 - 6) / cols
    const fh = 60
    for (let i = 0; i < fotoUrls.length; i++) {
      const col = i % cols
      if (col === 0 && i > 0) y += fh + 16
      if (y + fh + 16 > 272) {
        doc.addPage(); bgPage(doc); drawHeader(doc, 'Reinigungsprotokoll', datum, nr); y = 38
        y = sectionTitle(doc, `DOKUMENTATIONSFOTOS (${fotoUrls.length})`, y)
      }
      const fx = M + col * (fw + 6)
      doc.setFillColor(...WHITE); doc.setDrawColor(...BORDER); doc.setLineWidth(0.3)
      doc.roundedRect(fx, y, fw, fh + 9, 2, 2, 'FD')
      doc.setFillColor(...CYAN); doc.rect(fx, y, fw, 2, 'F')
      const data = await imgToBase64(fotoUrls[i])
      if (data) { try { doc.addImage(data, data.startsWith('data:image/png') ? 'PNG' : 'JPEG', fx + 2, y + 4.5, fw - 4, fh - 1) } catch {} }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...MUTED)
      doc.text(`Foto ${i + 1}  ·  ${fmtDate(datum)}`, fx + 4, y + fh + 7)
    }
    y += fh + 20
  }

  // Unterschrift Mitarbeiter
  {
    if (y > 196) { doc.addPage(); bgPage(doc); drawHeader(doc, 'Reinigungsprotokoll', datum, nr); y = 38 }
    y = sectionTitle(doc, 'UNTERSCHRIFT MITARBEITER', y)
    const sw = PW - M * 2
    const sh = 40
    doc.setFillColor(...WHITE); doc.setDrawColor(...BORDER); doc.setLineWidth(0.3)
    doc.roundedRect(M, y, sw, sh, 2, 2, 'FD')
    if (signatureDataURL) { try { doc.addImage(signatureDataURL, 'PNG', M + 4, y + 3, sw - 8, sh - 6) } catch {} }
    doc.setDrawColor(...CYAN); doc.setLineWidth(0.4)
    doc.line(M + 5, y + sh + 6, M + 90, y + sh + 6)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...DARK)
    doc.text(mitarbeiter || 'Nautilus Team', M + 6, y + sh + 12)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...MUTED)
    doc.text('Mitarbeiter, Nautilus Facility Cleaning', M + 6, y + sh + 16.5)
    doc.text('Berlin, ' + fmtDate(datum), M + 90, y + sh + 16.5, { align: 'right' })
    y += sh + 22

    const hw = PW - M * 2
    doc.setFillColor(...PAPER); doc.setDrawColor(...BORDER); doc.setLineWidth(0.3)
    doc.roundedRect(M, y, hw, 14, 2, 2, 'FD')
    leftBar(doc, M, y, 14)
    doc.setFont('helvetica', 'italic'); doc.setFontSize(6.5); doc.setTextColor(...MUTED)
    doc.text('Mit seiner Unterschrift bestätigt der Mitarbeiter die ordnungsgemäße Durchführung aller Reinigungsarbeiten.', M + 7, y + 5.5, { maxWidth: hw - 10 })
    doc.text('Dieses Protokoll wurde digital erstellt und ist ohne Stempel gültig.', M + 7, y + 11)
  }

  const total = doc.internal.getNumberOfPages()
  for (let i = 1; i <= total; i++) { doc.setPage(i); drawFooter(doc, i, total) }
  return doc.output('blob')
}

// ─────────────────────────────────────────────────────────
// HINWEIS PDF (Schadensmeldung)
// ─────────────────────────────────────────────────────────
export async function generateSchadenPDF({
  objekt, hausverwaltung, titel, beschreibung, datum, nummer = null, behoben = false, fotoUrl = null, fotoUrls = []
}) {
  const fotos = (fotoUrls && fotoUrls.length) ? fotoUrls : (fotoUrl ? [fotoUrl] : [])
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const nr  = nummer || `NFS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900 + 100))}`
  const d   = datum || new Date().toISOString().split('T')[0]
  await ensureLogo()

  bgPage(doc)
  drawHeader(doc, 'Hinweismeldung', d, nr)

  let y = 38
  const TW = PW - 2 * M
  y = infoPanel(doc, y, [
    ['OBJEKT', objekt?.name || 'k. A.', objekt?.adresse || ''],
    ['KUNDE', hausverwaltung || 'k. A.', ''],
    ['GEMELDET AM', fmtDate(d), ''],
  ]) + 13

  y = sectionTitle(doc, 'HINWEIS', y)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...DARK)
  doc.text(titel || 'Ohne Titel', M, y - 2, { maxWidth: TW })
  y += 10

  if (beschreibung?.trim()) {
    y = sectionTitle(doc, 'BESCHREIBUNG', y)
    const lines = doc.splitTextToSize(beschreibung, PW - M * 2 - 14)
    const bh = lines.length * 5.5 + 12
    doc.setFillColor(...PAPER); doc.setDrawColor(...BORDER); doc.setLineWidth(0.3)
    doc.roundedRect(M, y, PW - M * 2, bh, 2, 2, 'FD')
    leftBar(doc, M, y, bh)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED)
    doc.text(lines, M + 8, y + 7.5)
    y += bh + 12
  }

  if (fotos.length > 0) {
    if (y > 190) { doc.addPage(); bgPage(doc); drawHeader(doc, 'Hinweismeldung', d, nr); y = 38 }
    y = sectionTitle(doc, `FOTODOKUMENTATION (${fotos.length})`, y)
    const single = fotos.length === 1
    const cols = single ? 1 : 2
    const fw = single ? (PW - M * 2) : (PW - M * 2 - 6) / cols
    const fh = single ? 95 : 62
    for (let i = 0; i < fotos.length; i++) {
      const col = i % cols
      if (col === 0 && i > 0) y += fh + 16
      if (y + fh + 16 > 272) {
        doc.addPage(); bgPage(doc); drawHeader(doc, 'Hinweismeldung', d, nr); y = 38
        y = sectionTitle(doc, `FOTODOKUMENTATION (${fotos.length})`, y)
      }
      const fx = M + col * (fw + 6)
      doc.setFillColor(...WHITE); doc.setDrawColor(...BORDER); doc.setLineWidth(0.3)
      doc.roundedRect(fx, y, fw, fh + 9, 2, 2, 'FD')
      doc.setFillColor(...CYAN); doc.rect(fx, y, fw, 2, 'F')
      const data = await imgToBase64(fotos[i])
      if (data) { try { doc.addImage(data, data.startsWith('data:image/png') ? 'PNG' : 'JPEG', fx + 2, y + 4.5, fw - 4, fh - 1) } catch {} }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...MUTED)
      doc.text(`Foto ${i + 1}  ·  ${fmtDate(d)}`, fx + 4, y + fh + 7)
    }
    y += fh + 20
  }

  if (y > 250) { doc.addPage(); bgPage(doc); drawHeader(doc, 'Hinweismeldung', d, nr); y = 38 }
  y = sectionTitle(doc, 'STATUS', y)
  {
    const label = behoben ? 'Behoben' : 'Offen, nicht behoben'
    const col = behoben ? GREEN : RED
    const tint = behoben ? [236, 253, 245] : [254, 242, 242]
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    const tw = doc.getTextWidth(label)
    const P = 5, dotR = 1.15, gap = 2.6, hh = 8
    const w = P + dotR * 2 + gap + tw + P
    const mid = y + hh / 2
    doc.setFillColor(...tint); doc.roundedRect(M, y, w, hh, hh / 2, hh / 2, 'F')
    doc.setFillColor(...col); doc.circle(M + P + dotR, mid, dotR, 'F')
    doc.setTextColor(...col); doc.text(label, M + P + dotR * 2 + gap, mid, { baseline: 'middle' })
    y += hh + 12
  }

  doc.setFillColor(...PAPER); doc.setDrawColor(...BORDER); doc.setLineWidth(0.3)
  doc.roundedRect(M, y, PW - M * 2, 10, 2, 2, 'FD')
  leftBar(doc, M, y, 10)
  doc.setFont('helvetica', 'italic'); doc.setFontSize(6.5); doc.setTextColor(...MUTED)
  doc.text('Dieser Hinweis wurde durch das Nautilus Facility Cleaning Portal erstellt.', M + 7, y + 6, { maxWidth: PW - M * 2 - 10 })

  const total = doc.internal.getNumberOfPages()
  for (let i = 1; i <= total; i++) { doc.setPage(i); drawFooter(doc, i, total) }
  return doc.output('blob')
}
