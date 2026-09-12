import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export async function downloadWeeklyReport({
  student,
  habits,
  logEntries,
  className,
  schoolName = "SDIT SAPTARA",
}: {
  student: any;
  habits: any[];
  logEntries: any[];
  className: string;
  schoolName?: string;
}) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Laporan Mingguan", {
    views: [{ showGridLines: false }],
  });

  // Calculate current week (Mon-Sun)
  const now = new Date();
  const day = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1);
  monday.setHours(0, 0, 0, 0);

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const formatDate = (d: Date) => {
    // Return YYYY-MM-DD in local time
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dNum = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dNum}`;
  };
  
  const strDates = dates.map(formatDate);
  const weekRange = `${dates[0].toLocaleDateString("id-ID", { day: "numeric", month: "short" })} - ${dates[6].toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`;

  // Column widths
  ws.columns = [
    { width: 5 }, // A No
    { width: 25 }, // B Indikator
    { width: 5 }, // C Sen
    { width: 5 }, // D Sel
    { width: 5 }, // E Rab
    { width: 5 }, // F Kam
    { width: 5 }, // G Jum
    { width: 5 }, // H Sab
    { width: 5 }, // I Min
    { width: 8 }, // J Hasil
    { width: 40 }, // K Deskripsi
  ];

  // ── Header Rows ──
  ws.mergeCells("A1:K1");
  ws.mergeCells("A2:K2");
  
  const titleCell = ws.getCell("A1");
  titleCell.value = "LAPORAN MINGGUAN 7KAIH SAPTARA";
  titleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC00000" } }; // Dark red

  const subTitleCell = ws.getCell("A2");
  subTitleCell.value = "Laporan Penerapan Gerakan Tujuh Kebiasaan Anak Indonesia Hebat (7KAIH) - Berbasis Pantauan Mingguan Aplikasi SAPTARA";
  subTitleCell.font = { name: "Arial", size: 9, italic: true, color: { argb: "FFFFFFFF" } };
  subTitleCell.alignment = { horizontal: "center", vertical: "middle" };
  subTitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC00000" } };

  // Helper for info cells
  const setInfoCell = (cell: any, text: string, bg = false) => {
    cell.value = text;
    cell.font = { name: "Arial", size: 10, bold: bg };
    cell.alignment = { vertical: "middle", horizontal: bg ? "center" : "left", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FFBFBFBF" } },
      left: { style: "thin", color: { argb: "FFBFBFBF" } },
      bottom: { style: "thin", color: { argb: "FFBFBFBF" } },
      right: { style: "thin", color: { argb: "FFBFBFBF" } },
    };
    if (bg) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF2CC" } };
    }
  };

  // Row 3
  ws.mergeCells("B3:C3");
  ws.mergeCells("E3:G3");
  ws.mergeCells("H3:K3"); 
  setInfoCell(ws.getCell("A3"), "Nama");
  setInfoCell(ws.getCell("B3"), student.name, true);
  setInfoCell(ws.getCell("D3"), "Kelas");
  setInfoCell(ws.getCell("E3"), className, true);

  // Row 4
  ws.mergeCells("B4:C4");
  ws.mergeCells("E4:G4");
  ws.mergeCells("H4:K4");
  setInfoCell(ws.getCell("A4"), "Skor");
  setInfoCell(ws.getCell("B4"), `${student.xp} mil`, true);
  setInfoCell(ws.getCell("D4"), "Satuan Pendidikan");
  setInfoCell(ws.getCell("E4"), schoolName, true);

  // Row 5
  ws.mergeCells("B5:C5");
  ws.mergeCells("E5:G5");
  ws.mergeCells("H5:K5");
  setInfoCell(ws.getCell("A5"), "Minggu Ke- /");
  setInfoCell(ws.getCell("B5"), "1", true);
  setInfoCell(ws.getCell("D5"), "Semester / Tahun Ajaran");
  setInfoCell(ws.getCell("E5"), "1 / 2026", true);

  // Row 6
  ws.mergeCells("B6:C6");
  ws.mergeCells("E6:G6");
  ws.mergeCells("H6:K6");
  setInfoCell(ws.getCell("A6"), "Tanggal");
  setInfoCell(ws.getCell("B6"), weekRange, true);
  setInfoCell(ws.getCell("D6"), "");
  setInfoCell(ws.getCell("E6"), "", true);

  // Row 7 (Instructions)
  ws.mergeCells("A7:K7");
  const instCell = ws.getCell("A7");
  instCell.value = "*) Kotak berwarna kuning wajib diisi oleh guru/wali kelas. Isi kolom harian dengan tanda \"V\" jika Ananda melaksanakan kebiasaan dan mengunggah bukti pada aplikasi SAPTARA.";
  instCell.font = { name: "Arial", size: 8, italic: true };
  instCell.alignment = { vertical: "middle" };

  // ── Table Header (Row 8) ──
  const headers = ["No", "Indikator Kebiasaan", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min", "Hasil", "Deskripsi"];
  const headerRow = ws.getRow(8);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F3864" } }; // Dark blue
    cell.border = {
      top: { style: "thin", color: { argb: "FFFFFFFF" } },
      left: { style: "thin", color: { argb: "FFFFFFFF" } },
      bottom: { style: "thin", color: { argb: "FFFFFFFF" } },
      right: { style: "thin", color: { argb: "FFFFFFFF" } },
    };
  });
  headerRow.height = 20;

  // ── Habits Data (Rows 9-15) ──
  const habitNames = [
    "Bangun Pagi",
    "Beribadah",
    "Berolahraga",
    "Makan Sehat dan Bergizi",
    "Gemar Belajar",
    "Bermasyarakat",
    "Tidur Cepat"
  ];

  let totalDone = 0;
  let habitScores: {name: string, score: number}[] = [];

  habitNames.forEach((hName, i) => {
    // Find matching habit
    const matchHabit = habits?.find(h => h.name.toLowerCase().includes(hName.split(" ")[0].toLowerCase()));
    const hId = matchHabit ? matchHabit.id : i + 1;
    const finalName = matchHabit ? matchHabit.name : hName;
    
    const row = ws.getRow(9 + i);
    
    const noCell = row.getCell(1);
    noCell.value = i + 1;
    noCell.alignment = { horizontal: "center", vertical: "middle" };
    
    const indCell = row.getCell(2);
    indCell.value = finalName;
    indCell.font = { bold: true };
    indCell.alignment = { vertical: "middle" };

    let daysDone = 0;
    for (let d = 0; d < 7; d++) {
      const dayCell = row.getCell(3 + d);
      const dateStr = strDates[d];
      
      const hasEntry = logEntries?.some(e => e.date === dateStr && e.habitId === hId);
      
      if (hasEntry) {
        dayCell.value = "V";
        daysDone++;
      }
      dayCell.alignment = { horizontal: "center", vertical: "middle" };
      dayCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF2CC" } };
    }
    
    totalDone += daysDone;
    habitScores.push({ name: finalName, score: daysDone });

    // Hasil column (Formula COUNTIF)
    const hasilCell = row.getCell(10);
    hasilCell.value = { formula: `COUNTIF(C${9 + i}:I${9 + i},"V")`, result: daysDone };
    hasilCell.numFmt = '0"/7"';
    hasilCell.font = { bold: true };
    hasilCell.alignment = { horizontal: "center", vertical: "middle" };
    hasilCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" } };

    // Deskripsi column (Formula nested IF)
    const descCell = row.getCell(11);
    descCell.value = {
      formula: `IF(J${9 + i}=7,"Sangat Baik - Ananda konsisten melaksanakan kebiasaan '${finalName}' setiap hari.",IF(J${9 + i}>=4,"Baik - Ananda cukup rajin melaksanakan kebiasaan '${finalName}'.",IF(J${9 + i}>0,"Mulai Berkembang - Ananda mulai melaksanakan kebiasaan '${finalName}'.","Belum Terlaksana - Ananda belum melaksanakan kebiasaan '${finalName}' pada minggu ini.")))`
    };
    descCell.alignment = { vertical: "middle", wrapText: true };
    descCell.font = { size: 9 };
    
    for (let c = 1; c <= 11; c++) {
      row.getCell(c).border = {
        top: { style: "thin", color: { argb: "FFBFBFBF" } },
        left: { style: "thin", color: { argb: "FFBFBFBF" } },
        bottom: { style: "thin", color: { argb: "FFBFBFBF" } },
        right: { style: "thin", color: { argb: "FFBFBFBF" } },
      };
    }
    row.height = 30;
  });

  // ── Average Row (Row 16) ──
  const avgRow = ws.getRow(16);
  ws.mergeCells("A16:I16");
  const avgLabel = avgRow.getCell(1);
  avgLabel.value = "Rata-rata Capaian Kebiasaan per Minggu";
  avgLabel.font = { bold: true };
  avgLabel.alignment = { horizontal: "right", vertical: "middle" };
  avgLabel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9D9D9" } };
  
  const avgHasil = avgRow.getCell(10);
  const totalPossible = 7 * 7;
  const avgNum = Math.round((totalDone / totalPossible) * 7);
  avgHasil.value = { formula: "ROUND(SUM(J9:J15)/49*7, 0)", result: avgNum };
  avgHasil.numFmt = '0"/7"';
  avgHasil.font = { bold: true };
  avgHasil.alignment = { horizontal: "center", vertical: "middle" };
  avgHasil.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9D9D9" } };
  
  const avgDesc = avgRow.getCell(11);
  avgDesc.value = { formula: 'IF(J16>=6,"Sangat Baik",IF(J16>=4,"Berkembang","Perlu Bimbingan"))' };
  avgDesc.font = { bold: true };
  avgDesc.alignment = { vertical: "middle" };
  avgDesc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9D9D9" } };

  for (let c = 1; c <= 11; c++) {
      avgRow.getCell(c).border = {
        top: { style: "thin", color: { argb: "FFBFBFBF" } },
        left: { style: "thin", color: { argb: "FFBFBFBF" } },
        bottom: { style: "thin", color: { argb: "FFBFBFBF" } },
        right: { style: "thin", color: { argb: "FFBFBFBF" } },
      };
  }

  // ── Kesimpulan (Row 17-21) ──
  const kesHeaderRow = ws.getRow(17);
  ws.mergeCells("A17:K17");
  const kesHeader = kesHeaderRow.getCell(1);
  kesHeader.value = "KESIMPULAN";
  kesHeader.font = { bold: true, color: { argb: "FFFFFFFF" } };
  kesHeader.alignment = { horizontal: "center", vertical: "middle" };
  kesHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F3864" } };
  
  ws.mergeCells("A18:K21");
  const kesRow = ws.getRow(18);
  const kesBody = kesRow.getCell(1);
  
  const bestHabit = habitScores.reduce((a, b) => a.score > b.score ? a : b, {name: "", score: -1});
  
  // Create dynamic string using INDEX(MATCH)
  const kesimpulanFormula = `IF(MAX(J9:J15)>0, "Ananda " & B3 & " unggul dalam kebiasaan '" & INDEX(B9:B15, MATCH(MAX(J9:J15), J9:J15, 0)) & "' karena telah melaksanakannya secara konsisten (" & MAX(J9:J15) & "/7 hari) dan mengunggah bukti pada aplikasi SAPTARA selama satu minggu ini. Kebiasaan lainnya perlu terus dipantau dan didampingi agar semakin membudaya.", "Ananda " & B3 & " belum melaksanakan satupun kebiasaan minggu ini. Mohon didampingi agar mulai melaksanakan dan mengunggah bukti di aplikasi SAPTARA.")`;

  kesBody.value = { formula: kesimpulanFormula };
  
  kesBody.font = { italic: true, bold: true, color: { argb: "FF1F3864" } };
  kesBody.alignment = { vertical: "top", wrapText: true, indent: 1 };
  kesBody.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2EFDA" } }; // Light green
  
  // ── Signature (Row 23 & 27) ──
  const ttdRow = ws.getRow(23);
  ttdRow.getCell(3).value = "Mengetahui,\nOrang Tua/Wali";
  ttdRow.getCell(3).alignment = { horizontal: "center", wrapText: true };
  
  ttdRow.getCell(9).value = `........................, ........................ 20....\nGuru Wali Kelas`;
  ttdRow.getCell(9).alignment = { horizontal: "center", wrapText: true };
  ws.mergeCells("I23:K23");

  const ttdRowBot = ws.getRow(27);
  ttdRowBot.getCell(3).value = "(......................................................)";
  ttdRowBot.getCell(3).alignment = { horizontal: "center" };
  
  ttdRowBot.getCell(9).value = "(......................................................)";
  ttdRowBot.getCell(9).alignment = { horizontal: "center" };
  ws.mergeCells("I27:K27");

  // Generate & Save
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `Laporan_Mingguan_${student.name.replace(/\s+/g, "_")}_${strDates[6]}.xlsx`);
}
