<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Rekapitulasi Kebiasaan Kelas - {{ $class->class_code ?? $class->classCode }}</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 1.2cm;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
            line-height: 1.3;
            font-size: 10pt;
            margin: 0;
            padding: 0;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .header h1 {
            margin: 0;
            font-size: 16pt;
            color: #0369a1;
            text-transform: uppercase;
        }
        .header p {
            margin: 2px 0 0 0;
            font-size: 9.5pt;
            color: #64748b;
        }
        .info-bar {
            margin-bottom: 12px;
            font-size: 9.5pt;
        }
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        table.data-table th {
            background-color: #0284c7;
            color: #ffffff;
            font-size: 8.5pt;
            text-transform: uppercase;
            padding: 7px 4px;
            border: 1px solid #0284c7;
            text-align: center;
        }
        table.data-table td {
            padding: 6px 5px;
            border: 1px solid #cbd5e1;
            font-size: 8.5pt;
        }
        table.data-table tr:nth-child(even) {
            background-color: #f8fafc;
        }
        .footer {
            margin-top: 15px;
            text-align: right;
            font-size: 8pt;
            color: #94a3b8;
        }
    </style>
</head>
<body>

    <div class="header">
        <h1>Rekapitulasi Pelayaran Pembiasaan Kelas</h1>
        <p>{{ $class->school_name ?? $class->schoolName }} — Kelas {{ $class->class_code ?? $class->classCode }} (Kapal "{{ $class->ship_name ?? $class->shipName ?? 'Saptara' }}")</p>
    </div>

    <div class="info-bar">
        <strong>Guru Pembina:</strong> {{ $teacher->display_name ?? $teacher->displayName ?? 'Guru Kelas' }} | 
        <strong>Total Siswa:</strong> {{ count($students) }} siswa | 
        <strong>Semester / TA:</strong> {{ $class->semester ?? 'Ganjil' }} {{ $class->tahun_ajaran ?? '2026/2027' }} |
        <strong>Tanggal Cetak:</strong> {{ date('d/m/Y') }}
    </div>

    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 3%;">No</th>
                <th style="width: 18%; text-align: left;">Nama Siswa</th>
                <th style="width: 12%;">Level Kapal</th>
                <th style="width: 8%;">Streak</th>
                <th style="width: 10%;">Mil (XP)</th>
                <th style="width: 9%;">Koin</th>
                <th style="width: 10%;">Jurnal Foto</th>
                <th style="width: 10%;">Ceklis Habit</th>
                <th style="width: 10%;">Lencana</th>
                <th style="width: 10%;">Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($students as $idx => $s)
                <tr>
                    <td style="text-align: center;">{{ $idx + 1 }}</td>
                    <td><strong>{{ $s->name }}</strong></td>
                    <td style="text-align: center;">{{ $s->ship_level['name'] ?? 'Pelaut Pemula' }}</td>
                    <td style="text-align: center; font-weight: bold; color: #d97706;">{{ $s->streak ?? 0 }} hari</td>
                    <td style="text-align: center; font-weight: bold; color: #0284c7;">{{ number_format($s->xp ?? 0) }}</td>
                    <td style="text-align: center;">{{ number_format($s->coins ?? 0) }} 🪙</td>
                    <td style="text-align: center; color: #16a34a; font-weight: bold;">{{ $s->verified_logs_count ?? 0 }}</td>
                    <td style="text-align: center;">{{ $s->completions_count ?? 0 }}</td>
                    <td style="text-align: center;">{{ $s->badges_count ?? 0 }} 🎖️</td>
                    <td style="text-align: center;">
                        @if(($s->streak ?? 0) >= 3)
                            <span style="color: #16a34a; font-weight: bold;">Sangat Aktif</span>
                        @elseif(($s->streak ?? 0) >= 1)
                            <span style="color: #0284c7;">Aktif</span>
                        @else
                            <span style="color: #ef4444;">Perlu Dorongan</span>
                        @endif
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Dicetak dari Aplikasi SAPTARA Kemaritiman Karakter — {{ date('d F Y, H:i') }} WIB
    </div>

</body>
</html>
