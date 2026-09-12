<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Jurnal Terverifikasi</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f0f9ff; margin: 0; padding: 20px; color: #1e293b;">
    <div style="max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #bae6fd; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0284c7, #0369a1); padding: 24px 20px; text-align: center; color: #ffffff;">
            <span style="font-size: 36px; display: block; margin-bottom: 8px;">⛵</span>
            <h2 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">SAPTARA</h2>
            <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">7 Kebiasaan Anak Indonesia Hebat</p>
        </div>

        <!-- Body -->
        <div style="padding: 24px 20px;">
            <p style="font-size: 15px; margin-top: 0;">Halo Ayah / Bunda dari <strong>{{ $student->name }}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.5; color: #475569;">
                Kabar gembira! Guru telah memeriksa dan menyetujui jurnal foto kegiatan pembiasaan ananda di sekolah/rumah:
            </p>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;"><strong>Kebiasaan:</strong> {{ $entry->habit?->name ?? 'Kegiatan Pembiasaan' }}</p>
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;"><strong>Tanggal & Waktu:</strong> {{ $entry->date?->format('d F Y') }} pukul {{ substr($entry->time, 0, 5) }} WIB</p>
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;"><strong>Keterangan Siswa:</strong> "{{ $entry->caption }}"</p>
                @if($sticker)
                    <p style="margin: 12px 0 4px 0; font-size: 14px; color: #0284c7;"><strong>Apresiasi Guru:</strong> <span style="background: #e0f2fe; padding: 4px 8px; border-radius: 8px; font-weight: bold;">{{ $sticker }}</span></p>
                @endif
                @if($comment)
                    <p style="margin: 8px 0 0 0; font-size: 13px; color: #334155; font-style: italic;">"{{ $comment }}"</p>
                @endif
            </div>

            <div style="text-align: center; margin: 25px 0 15px 0;">
                <p style="font-size: 13px; color: #64748b;">Terus berikan motivasi dan dukungan bagi pelayaran kebiasaan positif ananda setiap hari!</p>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 14px 20px; text-align: center; font-size: 12px; color: #94a3b8;">
            Email ini dikirim otomatis melalui sistem SAPTARA Kelas {{ $student->class?->class_code }}.
        </div>

    </div>
</body>
</html>
