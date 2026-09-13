<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Raport Karakter Siswa - {{ $student->name }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 1.5cm 1.5cm 1.5cm 1.5cm;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
            line-height: 1.4;
            font-size: 11pt;
            margin: 0;
            padding: 0;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 12px;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 18pt;
            color: #0369a1;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .header p {
            margin: 3px 0 0 0;
            font-size: 10pt;
            color: #64748b;
        }
        .sub-header {
            margin-top: 5px;
            font-size: 11pt;
            font-weight: bold;
            color: #0f172a;
        }
        .profile-table {
            width: 100%;
            margin-bottom: 20px;
            border-collapse: collapse;
        }
        .profile-table td {
            padding: 5px 8px;
            font-size: 10pt;
        }
        .profile-table .label {
            width: 25%;
            font-weight: bold;
            color: #475569;
        }
        .profile-table .val {
            width: 75%;
            color: #0f172a;
        }
        .summary-boxes {
            width: 100%;
            margin-bottom: 20px;
        }
        .summary-box {
            display: inline-block;
            width: 30%;
            background-color: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 8px;
            padding: 10px;
            text-align: center;
            margin-right: 2%;
            vertical-align: top;
            box-sizing: border-box;
        }
        .summary-box:last-child {
            margin-right: 0;
        }
        .summary-box .num {
            font-size: 16pt;
            font-weight: bold;
            color: #0284c7;
            margin: 3px 0;
        }
        .summary-box .title {
            font-size: 8pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #0369a1;
            font-weight: bold;
        }
        table.habit-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        table.habit-table th {
            background-color: #0284c7;
            color: #ffffff;
            font-size: 9pt;
            text-transform: uppercase;
            padding: 8px 6px;
            border: 1px solid #0284c7;
            text-align: center;
        }
        table.habit-table td {
            padding: 7px 6px;
            border: 1px solid #cbd5e1;
            font-size: 9.5pt;
        }
        table.habit-table tr:nth-child(even) {
            background-color: #f8fafc;
        }
        .badge-list {
            margin-bottom: 20px;
            padding: 10px;
            background-color: #fffbeb;
            border: 1px solid #fde68a;
            border-radius: 8px;
        }
        .badge-list h4 {
            margin: 0 0 6px 0;
            font-size: 10pt;
            color: #b45309;
        }
        .badge-tag {
            display: inline-block;
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            color: #92400e;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 8.5pt;
            font-weight: bold;
            margin: 2px 4px 2px 0;
        }
        .signature-table {
            width: 100%;
            margin-top: 30px;
            border-collapse: collapse;
        }
        .signature-table td {
            width: 50%;
            text-align: center;
            font-size: 10pt;
        }
        .signature-space {
            height: 60px;
        }
        .footer {
            margin-top: 25px;
            text-align: center;
            font-size: 8pt;
            color: #94a3b8;
            border-top: 1px dashed #cbd5e1;
            padding-top: 8px;
        }
    </style>
</head>
<body>

    <div class="header">
        <h1>Raport Pelayaran Karakter</h1>
        <p>7 Kebiasaan Anak Indonesia Hebat (SAPTARA)</p>
        <div class="sub-header">{{ $class->school_name ?? $class->schoolName }} — Kelas {{ $class->class_code ?? $class->classCode }}</div>
    </div>

    <table class="profile-table">
        <tr>
            <td class="label">Nama Lengkap Awak:</td>
            <td class="val"><strong>{{ $student->name }}</strong> ({{ $student->avatar }})</td>
            <td class="label">Nama Kapal:</td>
            <td class="val">{{ $class->ship_name ?? $class->shipName ?? 'KRI Saptara' }}</td>
        </tr>
        <tr>
            <td class="label">Level Pelayaran:</td>
            <td class="val">{{ $student->ship_level['name'] ?? 'Pelaut Pemula' }} ({{ $student->ship_level['ship'] ?? '⛵' }})</td>
            <td class="label">Tahun Pelajaran:</td>
            <td class="val">{{ $class->tahun_ajaran ?? '2026/2027' }} — {{ $class->semester ?? 'Ganjil' }}</td>
        </tr>
    </table>

    <div class="summary-boxes">
        <div class="summary-box">
            <div class="title">Total Mil Pelayaran</div>
            <div class="num">{{ number_format($student->xp ?? 0) }} XP</div>
        </div>
        <div class="summary-box">
            <div class="title">Koin Karakter</div>
            <div class="num">{{ number_format($student->coins ?? 0) }} 🪙</div>
        </div>
        <div class="summary-box">
            <div class="title">Jurnal Foto Disetujui</div>
            <div class="num">{{ $verifiedLogbooksCount }} Jurnal</div>
        </div>
    </div>

    <h3 style="font-size: 11pt; color: #0369a1; margin-bottom: 8px;">Capaian 7 Pulau Kebiasaan</h3>
    <table class="habit-table">
        <thead>
            <tr>
                <th style="width: 5%;">No</th>
                <th style="width: 35%; text-align: left;">Nama Kebiasaan</th>
                <th style="width: 25%; text-align: left;">Gugus Pulau</th>
                <th style="width: 15%;">Ceklis Selesai</th>
                <th style="width: 20%;">Foto Jurnal</th>
            </tr>
        </thead>
        <tbody>
            @foreach($habits as $idx => $habit)
                <tr>
                    <td style="text-align: center;">{{ $idx + 1 }}</td>
                    <td><strong>{{ $habit->name }}</strong></td>
                    <td>{{ $habit->island }}</td>
                    <td style="text-align: center; font-weight: bold; color: #0284c7;">
                        {{ $habitStats[$habit->id]['completions'] ?? 0 }} kali
                    </td>
                    <td style="text-align: center; font-weight: bold; color: #16a34a;">
                        {{ $habitStats[$habit->id]['verified_logs'] ?? 0 }} foto
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    @if(!empty($badges) && count($badges) > 0)
    <div class="badge-list">
        <h4>🎖️ Piagam & Lencana Kehormatan yang Diraih:</h4>
        @foreach($badges as $badge)
            <span class="badge-tag">{{ $badge->habit?->name ?? 'Lencana Kebiasaan' }}</span>
        @endforeach
    </div>
    @endif

    <table class="signature-table">
        <tr>
            <td>
                Mengetahui,<br>
                Orang Tua / Wali Siswa
                <div class="signature-space"></div>
                <strong>( ________________________ )</strong>
            </td>
            <td>
                {{ date('d F Y') }}<br>
                Guru Kelas / Pembina
                <div class="signature-space"></div>
                <strong>( {{ $teacher->display_name ?? $teacher->displayName ?? 'Guru Kelas' }} )</strong>
            </td>
        </tr>
    </table>

    <div class="footer">
        Dicetak otomatis melalui Aplikasi SAPTARA — Mengembangkan Karakter & Kebiasaan Positif Siswa Indonesia
    </div>

</body>
</html>
